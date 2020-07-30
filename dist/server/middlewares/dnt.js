"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advertiseDoNotTrack = void 0;
const advertiseDoNotTrack = (_, res, next) => {
    res.setHeader('Tk', 'N');
    return next();
};
exports.advertiseDoNotTrack = advertiseDoNotTrack;
