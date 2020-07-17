import Stockfish from "../index";

const STARTPOS = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

let engine: Stockfish;

beforeEach(() => {
  engine = new Stockfish("./stockfish/engine");
});

afterEach(async () => {
  engine.kill();
});

describe("Stockfish", () => {
  it("errors commands after quitting", async () => {
    await engine.quit();
    expect(engine.eval()).rejects.toThrow();
  });
  it("supports options", async () => {
    // not sure of a good way to test this that wouldn't be flaky
    const anotherEngine = new Stockfish("./stockfish/engine", {
      "Debug Log File": "/dev/null",
      Contempt: -20,
      "Analysis Contempt": "Both",
      Threads: 1,
      Hash: 1,
      Ponder: true,
      MultiPV: 1,
      "Skill Level": 10,
      "Move Overhead": 30,
      "Minimum Thinking Time": 0,
      "Slow Mover": 10,
      nodestime: 16,
      // eslint-disable-next-line @typescript-eslint/camelcase
      UCI_Chess960: false,
      // eslint-disable-next-line @typescript-eslint/camelcase
      UCI_AnalyseMode: true,
      // eslint-disable-next-line @typescript-eslint/camelcase
      UCI_LimitStrength: true,
      // eslint-disable-next-line @typescript-eslint/camelcase
      UCI_Elo: 1450,
    });
    const position = await anotherEngine.board();
    expect(position.Fen).toBe(STARTPOS);
    await anotherEngine.kill();
  });
});

describe("eval()", () => {
  it("considers the initial board to favor white", async () => {
    const evaluation = await engine.eval();
    expect(evaluation.score).toBeGreaterThan(0);
  });
});

describe("position()", () => {
  it("defaults to the start position", async () => {
    await engine.position();
    const position = await engine.board();
    expect(position.Fen).toBe(STARTPOS);
  });
  it('accepts "startpos" as a position', async () => {
    await engine.position({ start: "startpos" });
    const position = await engine.board();
    expect(position.Fen).toBe(STARTPOS);
  });
  it("accepts a FEN start position", async () => {
    await engine.position({ start: E4 });
    const position = await engine.board();
    expect(position.Fen).toBe(E4);
  });
  it("performs moves", async () => {
    await engine.position({ moves: ["e2e4"] });
    const position = await engine.board();
    expect(position.Fen).toBe(E4);
  });
});

describe("newgame()", () => {
  it("runs", async () => {
    await engine.newgame();
    // engine provides no feedback, and spec says should work even if GUI never sends it
    expect(true).toBe(true);
  });
});
