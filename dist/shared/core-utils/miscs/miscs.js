"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCatchable = exports.isPromise = exports.compareSemVer = exports.randomInt = void 0;
function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
exports.randomInt = randomInt;
function compareSemVer(a, b) {
    const regExStrip0 = /(\.0+)+$/;
    const segmentsA = a.replace(regExStrip0, '').split('.');
    const segmentsB = b.replace(regExStrip0, '').split('.');
    const l = Math.min(segmentsA.length, segmentsB.length);
    for (let i = 0; i < l; i++) {
        const diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
        if (diff)
            return diff;
    }
    return segmentsA.length - segmentsB.length;
}
exports.compareSemVer = compareSemVer;
function isPromise(value) {
    return value && typeof value.then === 'function';
}
exports.isPromise = isPromise;
function isCatchable(value) {
    return value && typeof value.catch === 'function';
}
exports.isCatchable = isCatchable;
