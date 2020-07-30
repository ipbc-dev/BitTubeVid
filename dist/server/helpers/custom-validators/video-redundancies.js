"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVideoRedundancyTarget = void 0;
const misc_1 = require("./misc");
function isVideoRedundancyTarget(value) {
    return misc_1.exists(value) &&
        (value === 'my-videos' || value === 'remote-videos');
}
exports.isVideoRedundancyTarget = isVideoRedundancyTarget;
