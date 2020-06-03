"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class VideoFileMetadata {
    constructor(hash) {
        this.chapters = hash.chapters;
        this.format = hash.format;
        this.streams = hash.streams;
        delete this.format.filename;
    }
}
exports.VideoFileMetadata = VideoFileMetadata;
