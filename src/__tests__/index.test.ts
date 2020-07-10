import Stockfish from "../index";

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
  it("can evaluate positions", async () => {
    const evaluation = await engine.eval();
    expect(evaluation.score).toBeGreaterThan(0);
  });
});
