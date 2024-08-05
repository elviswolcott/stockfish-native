"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
exports.trim = function (text, delimiter) {
    return text
        .replace(new RegExp("^" + delimiter + "*"), "")
        .replace(new RegExp(delimiter + "*$"), "");
};
exports.split = function (text, delimeter) {
    return text.split(delimeter).map(function (s) { return s.trim(); });
};
exports.endAfterLabel = function (label) {
    return function (text) { return Boolean(text.match(label + ": .*\n")); };
};
exports.sections = function (content) {
    return exports.split(content, os_1.EOL.repeat(2));
};
exports.lines = function (content) { return exports.split(content, os_1.EOL); };
exports.parseLabeled = function (data) {
    return exports.lines(data).reduce(function (parsed, line) {
        var _a = exports.split(line, ":"), label = _a[0], value = _a[1];
        parsed[label] = value;
        return parsed;
    }, {});
};
