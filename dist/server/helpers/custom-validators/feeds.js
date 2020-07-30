"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidRSSFeed = void 0;
const misc_1 = require("./misc");
function isValidRSSFeed(value) {
    if (!misc_1.exists(value))
        return false;
    const feedExtensions = [
        'xml',
        'json',
        'json1',
        'rss',
        'rss2',
        'atom',
        'atom1'
    ];
    return feedExtensions.includes(value);
}
exports.isValidRSSFeed = isValidRSSFeed;
