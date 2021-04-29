"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const Jimp = require("jimp");
const path_1 = require("path");
const ffmpeg_utils_1 = require("./ffmpeg-utils");
const logger_1 = require("./logger");
function processImage(path, destination, newSize, keepOriginal = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const extension = path_1.extname(path);
        if (path === destination) {
            throw new Error('Jimp/FFmpeg needs an input path different that the output path.');
        }
        logger_1.logger.debug('Processing image %s to %s.', path, destination);
        if (extension === '.gif') {
            yield ffmpeg_utils_1.processGIF(path, destination, newSize);
        }
        else {
            yield jimpProcessor(path, destination, newSize, extension);
        }
        if (keepOriginal !== true)
            yield fs_extra_1.remove(path);
    });
}
exports.processImage = processImage;
function jimpProcessor(path, destination, newSize, inputExt) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let jimpInstance;
        const inputBuffer = yield fs_extra_1.readFile(path);
        try {
            jimpInstance = yield Jimp.read(inputBuffer);
        }
        catch (err) {
            logger_1.logger.debug('Cannot read %s with jimp. Try to convert the image using ffmpeg first.', path, { err });
            const newName = path + '.jpg';
            yield ffmpeg_utils_1.convertWebPToJPG(path, newName);
            yield fs_extra_1.rename(newName, path);
            jimpInstance = yield Jimp.read(path);
        }
        yield fs_extra_1.remove(destination);
        if (yield skipProcessing({ jimpInstance, newSize, imageBytes: inputBuffer.byteLength, inputExt, outputExt: path_1.extname(destination) })) {
            return fs_extra_1.copy(path, destination);
        }
        yield jimpInstance
            .resize(newSize.width, newSize.height)
            .quality(80)
            .writeAsync(destination);
    });
}
function skipProcessing(options) {
    const { jimpInstance, newSize, imageBytes, inputExt, outputExt } = options;
    const { width, height } = newSize;
    if (jimpInstance.getWidth() > width || jimpInstance.getHeight() > height)
        return false;
    if (inputExt !== outputExt)
        return false;
    const kB = 1000;
    if (height >= 1000)
        return imageBytes <= 200 * kB;
    if (height >= 500)
        return imageBytes <= 100 * kB;
    return imageBytes <= 15 * kB;
}
