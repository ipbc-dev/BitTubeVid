"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const ffmpeg_utils_1 = require("./ffmpeg-utils");
const logger_1 = require("./logger");
const Jimp = require('jimp');
function processImage(path, destination, newSize, keepOriginal = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (path === destination) {
            throw new Error('Jimp needs an input path different that the output path.');
        }
        logger_1.logger.debug('Processing image %s to %s.', path, destination);
        let jimpInstance;
        try {
            jimpInstance = yield Jimp.read(path);
        }
        catch (err) {
            logger_1.logger.debug('Cannot read %s with jimp. Try to convert the image using ffmpeg first.', { err });
            const newName = path + '.jpg';
            yield ffmpeg_utils_1.convertWebPToJPG(path, newName);
            yield fs_extra_1.rename(newName, path);
            jimpInstance = yield Jimp.read(path);
        }
        yield fs_extra_1.remove(destination);
        yield jimpInstance
            .resize(newSize.width, newSize.height)
            .quality(80)
            .writeAsync(destination);
        if (keepOriginal !== true)
            yield fs_extra_1.remove(path);
    });
}
exports.processImage = processImage;
