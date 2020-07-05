import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { EOL } from "os";

type Command = string | null;

interface QueueEntry {
  command: Command;
  callback: (result: string) => boolean;
}

class Stockfish {
  // commands are queued as only 1 can execute at a time
  private queue: QueueEntry[] = [];
  private running = false;
  private engine: ChildProcessWithoutNullStreams;
  private partialResponse = "";
  private didQuit = false;
  // spawn the child process, queue setoption commands, and setup listeners
  constructor(enginePath: string) {
    this.engine = spawn(enginePath);
    // wait for welcome message
    this.do(
      null,
      (response: string) =>
        response.indexOf(
          `Stockfish 11 64 POPCNT by T. Romstad, M. Costalba, J. Kiiski, G. Linscott`
        ) > -1
    );
  }
  async eval(): Promise<void> {
    await this.do(
      `eval`,
      (response) => response.indexOf(`Total evaluation:`) > -1
    );
    // TODO: parse result
    return;
  }
  async quit(): Promise<void> {
    await this.do(`quit`, () => true);
    this.didQuit = true;
  }
  // send a raw command to the engine and get the raw response
  private do(
    command: Command,
    done: (result: string) => boolean
  ): Promise<string> {
    if (this.didQuit) {
      throw new Error("Cannot perform commands after calling quit()");
    }
    return new Promise((resolve) => {
      const callback = (result: string): boolean => {
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
      const dataWritten = (data: string): void => {
        this.partialResponse += data;
        // pass the collected response to the callback
        if (current.callback(this.partialResponse)) {
          // true means the response was accepted as complete
          // reset the partial response for the next command
          this.partialResponse = "";
          // remove the listner
          this.engine.removeAllListeners("data");
          // restart on the next entry
          this.running = false;
          this.advanceQueue();
        }
      };
      // prepare the listener before writing
      this.engine.stdout.on("data", dataWritten);
      this.engine.on("close", () => {
        dataWritten("\n");
      });
      // send the uci string
      if (current.command) {
        this.engine.stdin.write(`${current.command}${EOL}`);
      }
    }
  }
}

export default Stockfish;
