"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function regexpCapture(str, regex, maxIterations = 100) {
    const result = [];
    let m;
    let i = 0;
    while ((m = regex.exec(str)) !== null && i < maxIterations) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        result.push(m);
        i++;
    }
    return result;
}
exports.regexpCapture = regexpCapture;
