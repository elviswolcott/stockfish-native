declare type Score = number | null;
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
declare type StockfishOptions = Partial<{
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
declare type SearchOptions = Partial<{
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
declare class Stockfish {
    private queue;
    private running;
    private engine;
    private partialResponse;
    private didQuit;
    private listener;
    private currentPosition;
    constructor(enginePath: string, options?: StockfishOptions);
    setoptions(options: StockfishOptions): Promise<void>;
    search(options: SearchOptions): Promise<string>;
    stop(): void;
    eval(): Promise<Evaluation>;
    position(position?: Partial<Position>): Promise<void>;
    board(): Promise<Board>;
    newgame(): Promise<void>;
    quit(): Promise<void>;
    kill(): void;
    private do;
    private advanceQueue;
}
export default Stockfish;
