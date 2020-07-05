import Stockfish from "../index";

let engine: Stockfish;

beforeEach(() => {
  engine = new Stockfish("./stockfish/engine");
});

describe("Stockfish", () => {
  it("errors commands after quitting", async () => {
    await engine.quit();
    expect(engine.eval()).rejects.toThrow();
  });
});
