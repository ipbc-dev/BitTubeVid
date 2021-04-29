"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveAndProcessCaptionFile = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const srt2vtt = require("srt-to-vtt");
const config_1 = require("../initializers/config");
function moveAndProcessCaptionFile(physicalFile, videoCaption) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoCaptionsDir = config_1.CONFIG.STORAGE.CAPTIONS_DIR;
        const destination = path_1.join(videoCaptionsDir, videoCaption.filename);
        if (physicalFile.path.endsWith('.srt')) {
            yield convertSrtToVtt(physicalFile.path, destination);
            yield fs_extra_1.remove(physicalFile.path);
        }
        else if (physicalFile.path !== destination) {
            yield fs_extra_1.move(physicalFile.path, destination, { overwrite: true });
        }
        physicalFile.filename = videoCaption.filename;
        physicalFile.path = destination;
    });
}
exports.moveAndProcessCaptionFile = moveAndProcessCaptionFile;
function convertSrtToVtt(source, destination) {
    return new Promise((res, rej) => {
        const file = fs_extra_1.createReadStream(source);
        const converter = srt2vtt();
        const writer = fs_extra_1.createWriteStream(destination);
        for (const s of [file, converter, writer]) {
            s.on('error', err => rej(err));
        }
        return file.pipe(converter)
            .pipe(writer)
            .on('finish', () => res());
    });
}
