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
