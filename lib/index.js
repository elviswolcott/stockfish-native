"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var os_1 = require("os");
var parser_utils_1 = require("./parser-utils");
var Stockfish = /** @class */ (function () {
    // spawn the child process, queue setoption commands, and setup listeners
    function Stockfish(enginePath, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // commands are queued as only 1 can execute at a time
        this.queue = [];
        this.running = false;
        this.partialResponse = "";
        this.didQuit = false;
        this.listener = null;
        this.currentPosition = "";
        this.engine = child_process_1.spawn(enginePath);
        // when the process is closes, send a terminating newline to ensure all listeners are fired
        this.engine.on("close", function () {
            if (_this.didQuit) {
                return;
            }
            _this.engine.stdout
                .rawListeners("data")
                .forEach(function (listener) { return listener("\n"); });
            _this.didQuit = true;
        });
        // update response from stdout
        this.engine.stdout.on("data", function (data) {
            _this.partialResponse += data;
            _this.partialResponse = _this.listener
                ? _this.listener(_this.partialResponse)
                : _this.partialResponse;
        });
        // wait for welcome message
        this.do(null, function (response) { return response.indexOf("Stockfish") > -1; });
        // set options
        this.setoptions(options);
        // although the contructor is sync, the next command will wait for everything to process
    }
    Stockfish.prototype.setoptions = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var option;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        for (option in options) {
                            this.do("setoption name " + option + " value " + options[option], null);
                        }
                        // send isready
                        return [4 /*yield*/, this.do("isready", function (response) { return response.indexOf("readyok") > -1; })];
                    case 1:
                        // send isready
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Stockfish.prototype.search = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var infinite, ponder, searchmoves, basicOptions, command, response, lines, last, bestMove;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        infinite = options.infinite, ponder = options.ponder, searchmoves = options.searchmoves, basicOptions = __rest(options, ["infinite", "ponder", "searchmoves"]);
                        command = "go";
                        if (infinite) {
                            command += " infinite";
                        }
                        if (ponder) {
                            command += " ponder";
                        }
                        if (searchmoves) {
                            command += " searchmoves " + searchmoves.join(" ");
                        }
                        Object.entries(basicOptions).forEach(function (_a) {
                            var name = _a[0], value = _a[1];
                            command += " " + name + " " + value;
                        });
                        return [4 /*yield*/, this.do(command, function (response) { return response.indexOf("bestmove") > -1; })];
                    case 1:
                        response = _a.sent();
                        lines = parser_utils_1.split(response, "\n");
                        last = lines[lines.length - 1];
                        bestMove = (last.match(/bestmove[\s]*([a-z,0-9]*)/) || [])[1];
                        return [4 /*yield*/, this.position({ start: this.currentPosition, moves: [bestMove] })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, bestMove];
                }
            });
        });
    };
    Stockfish.prototype.stop = function () {
        // bypass queuing
        this.engine.stdin.write("stop" + os_1.EOL);
    };
    Stockfish.prototype.eval = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, parsed, _a, table, data, _b, rawHeadings, rawHeadingsL2, content, _c, headings, _d, headingsL2, _i, content_1, line, _e, term, columns, _loop_1, index, labeled, totalScore;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this.do("eval", parser_utils_1.endAfterLabel("Total evaluation"))];
                    case 1:
                        response = _f.sent();
                        parsed = {};
                        _a = parser_utils_1.sections(response), table = _a[0], data = _a[1];
                        _b = parser_utils_1.lines(table), rawHeadings = _b[0], rawHeadingsL2 = _b[1], content = _b.slice(3);
                        _c = parser_utils_1.split(rawHeadings, "|"), headings = _c.slice(1);
                        _d = parser_utils_1.split(rawHeadingsL2, "|").map(function (group) {
                            return parser_utils_1.split(group, /\s+/g);
                        }), headingsL2 = _d.slice(1);
                        for (_i = 0, content_1 = content; _i < content_1.length; _i++) {
                            line = content_1[_i];
                            // divider
                            if (line.indexOf("------------+-------------+-------------+------------") <
                                0) {
                                _e = parser_utils_1.split(line, "|"), term = _e[0], columns = _e.slice(1);
                                _loop_1 = function (index) {
                                    var _a;
                                    var column = parser_utils_1.split(columns[index], /\s+/g).map(function (val) {
                                        return val === "----" ? null : parseFloat(val);
                                    });
                                    var l1 = headings[index];
                                    var l2group = headingsL2[index];
                                    parsed[term] = __assign((_a = {}, _a[l1] = l2group.reduce(function (joined, heading, index) {
                                        joined[heading] = column[index];
                                        return joined;
                                    }, {}), _a), parsed[term]);
                                };
                                for (index in columns) {
                                    _loop_1(index);
                                }
                            }
                        }
                        labeled = parser_utils_1.parseLabeled(data);
                        totalScore = parseFloat((labeled["Total evaluation"].match(/([-.\d]*)/) || [])[1]);
                        return [2 /*return*/, {
                                detailed: parsed,
                                score: totalScore === totalScore ? totalScore : null,
                            }];
                }
            });
        });
    };
    Stockfish.prototype.position = function (position) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var completePosition;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if ((_a = position) === null || _a === void 0 ? void 0 : _a.start) {
                            this.currentPosition = position.start;
                        }
                        completePosition = __assign({ moves: [], start: "startpos" }, (position || {}));
                        return [4 /*yield*/, this.do("position " + (completePosition.start === "startpos"
                                ? "startpos"
                                : "fen " + completePosition.start) + " moves " + completePosition.moves.join(" "), null)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Stockfish.prototype.board = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rawResponse, _a, board, data, labled, pieces;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.do("d", function (response) { return response.indexOf("Fen:") > -1; })];
                    case 1:
                        rawResponse = _b.sent();
                        _a = parser_utils_1.split(rawResponse, /\n\s*\n/), board = _a[0], data = _a[1];
                        labled = parser_utils_1.parseLabeled(data);
                        pieces = parser_utils_1.split(board, "\n")
                            .filter(function (line) { return line.indexOf(" ") > 0; })
                            .map(function (line) { return parser_utils_1.split(parser_utils_1.trim(line, "\\|"), "|"); });
                        return [2 /*return*/, __assign(__assign({}, labled), { pieces: pieces })];
                }
            });
        });
    };
    Stockfish.prototype.newgame = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.do("ucinewgame", null)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Stockfish.prototype.quit = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.do("quit", function () { return true; })];
                    case 1:
                        _a.sent();
                        this.didQuit = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    Stockfish.prototype.kill = function () {
        if (this.queue.length > 0) {
            console.warn("Killed engine with " + this.queue.length + " commands queued.");
        }
        this.didQuit = true;
        this.engine.kill("SIGINT");
    };
    // send a raw command to the engine and get the raw response
    Stockfish.prototype.do = function (command, done) {
        var _this = this;
        if (this.didQuit) {
            throw new Error("Cannot perform commands after calling quit()");
        }
        return new Promise(function (resolve) {
            var callback = function (result) {
                if (done === null) {
                    resolve("");
                    return true;
                }
                // resolve when the completion check returns true
                if (done(result)) {
                    resolve(result.trim());
                    return true;
                }
                else {
                    return false;
                }
            };
            _this.queue.push({
                command: command,
                callback: callback,
                immediate: done === null,
            });
            _this.advanceQueue();
        });
    };
    // starts processing the queue (if it not currently running)
    Stockfish.prototype.advanceQueue = function () {
        var _this = this;
        // can only run 1 command at a time
        if (this.running) {
            return;
        }
        // operate FIFO
        var current = this.queue.shift();
        if (current !== null && current !== undefined) {
            this.running = true;
            if (!current.immediate) {
                this.listener = function (response) {
                    // pass the collected response to the callback
                    if (current.callback(response)) {
                        // true means the response was accepted as complete
                        // restart on the next entry
                        _this.running = false;
                        _this.advanceQueue();
                        // clear response
                        return "";
                    }
                    return response;
                };
            }
            // send the uci string
            if (current.command) {
                this.engine.stdin.write("" + current.command + os_1.EOL);
            }
            // null indicates a command without a response
            if (current.immediate) {
                this.running = false;
                current.callback("");
                this.advanceQueue();
            }
        }
    };
    return Stockfish;
}());
exports.default = Stockfish;
