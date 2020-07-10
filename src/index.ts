import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { EOL } from "os";

type Command = string | null;

interface QueueEntry {
  command: Command;
  callback: (result: string) => boolean;
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

const splitClean = (text: string, delimeter: string | RegExp): string[] => {
  return text.split(delimeter).map((s) => s.trim());
};

type InjestResponse = (response: string) => boolean;
type UCIListener = (response: string) => string;

class Stockfish {
  // commands are queued as only 1 can execute at a time
  private queue: QueueEntry[] = [];
  private running = false;
  private engine: ChildProcessWithoutNullStreams;
  private partialResponse = "";
  private didQuit = false;
  private listener: null | UCIListener = null;
  // spawn the child process, queue setoption commands, and setup listeners
  constructor(enginePath: string) {
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
      console.log(this.partialResponse);
      this.partialResponse = this.listener
        ? this.listener(this.partialResponse)
        : this.partialResponse;
    });
    // wait for welcome message
    this.do(
      null,
      (response: string) =>
        response.indexOf(
          `Stockfish 11 64 POPCNT by T. Romstad, M. Costalba, J. Kiiski, G. Linscott`
        ) > -1
    );
  }
  async eval(): Promise<Evaluation> {
    const rawResponse = await this.do(
      `eval`,
      (response) => response.indexOf(`Total evaluation:`) > -1
    );
    // parse response
    const parsed = {} as EvaluationDetails;
    const lines = rawResponse.split(EOL);
    const [rawHeadings, rawHeadingsL2, , ...content] = lines;
    const [, ...headings] = splitClean(rawHeadings, "|");
    const [, ...headingsL2] = splitClean(rawHeadingsL2, "|").map((group) =>
      splitClean(group, /\s+/g)
    );

    for (const line of content) {
      // divider
      if (
        line.indexOf("------------+-------------+-------------+------------") <
        0
      ) {
        const [term, ...columns] = splitClean(line, "|");
        for (const index in columns) {
          const column = splitClean(columns[index], /\s+/g).map((val) =>
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
    const totalEvaluation =
      (rawResponse.match(/Total evaluation: (.*)\n/) || [])[1] || null;
    const totalScore = parseFloat(
      (totalEvaluation?.match(/([-.\d]*)/) || [])[1]
    );
    return {
      detailed: parsed,
      score: totalScore === totalScore ? totalScore : null,
    };
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
  private do(command: Command, done: InjestResponse): Promise<string> {
    if (this.didQuit) {
      throw new Error("Cannot perform commands after calling quit()");
    }
    return new Promise((resolve) => {
      const callback: InjestResponse = (result) => {
        // resolve when the completion check returns true
        if (done(result)) {
          resolve(result);
          return true;
        } else {
          return false;
        }
      };
      this.queue.push({
        command,
        callback,
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
    if (current) {
      this.running = true;
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
      // send the uci string
      if (current.command) {
        this.engine.stdin.write(`${current.command}${EOL}`);
      }
    }
  }
}

export default Stockfish;
