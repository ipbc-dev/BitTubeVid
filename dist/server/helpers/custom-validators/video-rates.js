"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRatingValid = void 0;
function isRatingValid(value) {
    return value === 'like' || value === 'dislike';
}
exports.isRatingValid = isRatingValid;
