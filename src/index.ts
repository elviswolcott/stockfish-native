import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { EOL } from "os";
import {
  split,
  endAfterLabel,
  lines,
  sections,
  parseLabeled,
  trim,
} from "./parser-utils";

type Command = string | null;

interface QueueEntry {
  command: Command;
  callback: InjestResponse;
  immediate: boolean;
}

type Score = number | null;

interface EvaluationSplit {
  EG: Score;
  MG: Score;
}

interface EvaluationEntry {
  White: EvaluationEntry;
  Black: EvaluationEntry;
  Total: EvaluationEntry;
}

interface EvaluationDetails {
  [term: string]: EvaluationEntry;
}

interface Evaluation {
  detailed: EvaluationDetails;
  score: Score;
}

type InjestResponse = (response: string) => boolean;
type UCIListener = (response: string) => string;

interface Position {
  start: string;
  moves: string[];
}

interface Board {
  Fen: string;
  Key: string;
  Checkers: string;
  pieces: string[][];
}

type StockfishOptions = Partial<{
  "Debug Log File": string;
  Contempt: number;
  "Analysis Contempt": "Both" | "Off" | "White" | "Black" | "Both";
  Threads: number;
  Hash: number;
  Ponder: boolean;
  MultiPV: number;
  "Skill Level": number;
  "Move Overhead": number;
  "Minimum Thinking Time": number;
  "Slow Mover": number;
  nodestime: number;
  UCI_Chess960: boolean;
  UCI_AnalyseMode: boolean;
  UCI_LimitStrength: boolean;
  UCI_Elo: number;
  SyzygyPath: string;
  SyzygyProbeDepth: number;
  Syzygy50MoveRule: boolean;
  SyzygyProbeLimit: number;
}>;

type SearchOptions = Partial<{
  depth: number;
  wtime: number;
  btime: number;
  winc: number;
  binc: number;
  movestogo: number;
  nodes: number;
  mate: number;
  movetime: number;
  infinite: boolean;
  ponder: boolean;
  searchmoves: string[];
}>;

class Stockfish {
  // commands are queued as only 1 can execute at a time
  private queue: QueueEntry[] = [];
  private running = false;
  private engine: ChildProcessWithoutNullStreams;
  private partialResponse = "";
  private didQuit = false;
  private listener: null | UCIListener = null;
  // spawn the child process, queue setoption commands, and setup listeners
  constructor(enginePath: string, options: StockfishOptions = {}) {
    this.engine = spawn(enginePath);
    // when the process is closes, send a terminating newline to ensure all listeners are fired
    this.engine.on("close", () => {
      if (this.didQuit) {
        return;
      }
      this.engine.stdout
        .rawListeners("data")
        .forEach((listener) => listener("\n"));
      this.didQuit = true;
    });
    // update response from stdout
    this.engine.stdout.on("data", (data: string | Buffer) => {
      this.partialResponse += data;
      this.partialResponse = this.listener
        ? this.listener(this.partialResponse)
        : this.partialResponse;
    });
    // wait for welcome message
    this.do(null, (response: string) => response.indexOf(`Stockfish`) > -1);
    // set options
    this.setoptions(options);
    // although the contructor is sync, the next command will wait for everything to process
  }
  async setoptions(options: StockfishOptions): Promise<void> {
    for (const option in options) {
      this.do(
        `setoption name ${option} value ${
          options[option as keyof StockfishOptions]
        }`,
        null
      );
    }
    // send isready
    await this.do(
      `isready`,
      (response: string) => response.indexOf(`readyok`) > -1
    );
  }
  async search(options: SearchOptions): Promise<string> {
    const { infinite, ponder, searchmoves, ...basicOptions } = options;
    let command = `go`;
    if (infinite) {
      command += ` infinite`;
    }
    if (ponder) {
      command += ` ponder`;
    }
    if (searchmoves) {
      command += ` searchmoves ${searchmoves.join(" ")}`;
    }
    Object.entries(basicOptions).forEach(
      ([name, value]) => ` ${name} ${value}`
    );
    const response = await this.do(
      command,
      (response: string) => response.indexOf(`bestmove`) > -1
    );
    const lines = split(response, "\n");
    const last = lines[lines.length - 1];
    return (last.match(/bestmove[\s]*([a-z,0-9]*)/) || [])[1];
  }
  stop(): void {
    // bypass queuing
    this.engine.stdin.write(`stop${EOL}`);
  }
  async eval(): Promise<Evaluation> {
    const response = await this.do(`eval`, endAfterLabel("Total evaluation"));
    // parse response
    const parsed = {} as EvaluationDetails;
    const [table, data] = sections(response);
    const [rawHeadings, rawHeadingsL2, , ...content] = lines(table);
    const [, ...headings] = split(rawHeadings, "|");
    const [, ...headingsL2] = split(rawHeadingsL2, "|").map((group) =>
      split(group, /\s+/g)
    );

    for (const line of content) {
      // divider
      if (
        line.indexOf("------------+-------------+-------------+------------") <
        0
      ) {
        const [term, ...columns] = split(line, "|");
        for (const index in columns) {
          const column = split(columns[index], /\s+/g).map((val) =>
            val === "----" ? null : parseFloat(val)
          );
          const l1 = headings[index];
          const l2group = headingsL2[index];
          parsed[term] = {
            [l1]: l2group.reduce((joined, heading, index) => {
              joined[heading as "MG" | "EG"] = column[index];
              return joined;
            }, {} as EvaluationSplit),
            ...parsed[term],
          };
        }
      }
    }
    const labeled = parseLabeled(data);
    const totalScore = parseFloat(
      (labeled["Total evaluation"].match(/([-.\d]*)/) || [])[1]
    );
    return {
      detailed: parsed,
      score: totalScore === totalScore ? totalScore : null,
    };
  }
  async position(position?: Partial<Position>): Promise<void> {
    const completePosition: Position = {
      moves: [],
      start: "startpos",
      ...(position || {}),
    };
    await this.do(
      `position ${
        completePosition.start === "startpos"
          ? "startpos"
          : `fen ${completePosition.start}`
      } moves ${completePosition.moves.join(" ")}`,
      null
    );
    return;
  }
  async board(): Promise<Board> {
    const rawResponse = await this.do(`d`, endAfterLabel("Checkers"));
    const [board, data] = split(rawResponse, "\n\n");
    const labled = parseLabeled(data);
    const pieces = split(board, "\n")
      .filter((line) => line.indexOf(" ") > 0)
      .map((line) => split(trim(line, "\\|"), "|"));
    return {
      ...labled,
      pieces,
    } as Board;
  }
  async newgame(): Promise<void> {
    await this.do(`ucinewgame`, null);
  }
  async quit(): Promise<void> {
    await this.do(`quit`, () => true);
    this.didQuit = true;
  }
  kill(): void {
    if (this.queue.length > 0) {
      console.warn(`Killed engine with ${this.queue.length} commands queued.`);
    }
    this.didQuit = true;
    this.engine.kill("SIGINT");
  }
  // send a raw command to the engine and get the raw response
  private do(command: Command, done: InjestResponse | null): Promise<string> {
    if (this.didQuit) {
      throw new Error("Cannot perform commands after calling quit()");
    }
    return new Promise((resolve) => {
      const callback: InjestResponse = (result) => {
        if (done === null) {
          resolve("");
          return true;
        }
        // resolve when the completion check returns true
        if (done(result)) {
          resolve(result.trim());
          return true;
        } else {
          return false;
        }
      };
      this.queue.push({
        command,
        callback,
        immediate: done === null,
      });
      this.advanceQueue();
    });
  }
  // starts processing the queue (if it not currently running)
  private advanceQueue(): void {
    // can only run 1 command at a time
    if (this.running) {
      return;
    }
    // operate FIFO
    const current = this.queue.shift();
    if (current !== null && current !== undefined) {
      this.running = true;
      if (!current.immediate) {
        this.listener = (response: string): string => {
          // pass the collected response to the callback
          if (current.callback(response)) {
            // true means the response was accepted as complete
            // restart on the next entry
            this.running = false;
            this.advanceQueue();
            // clear response
            return "";
          }
          return response;
        };
      }
      // send the uci string
      if (current.command) {
        this.engine.stdin.write(`${current.command}${EOL}`);
      }
      // null indicates a command without a response
      if (current.immediate) {
        this.running = false;
        current.callback("");
        this.advanceQueue();
      }
    }
  }
}

export default Stockfish;
