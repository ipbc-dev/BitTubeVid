"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("multer");
const sharp = require("sharp");
const fs_extra_1 = require("fs-extra");
const logger_1 = require("./logger");
function processImage(path, destination, newSize, keepOriginal = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (path === destination) {
            throw new Error('Sharp needs an input path different that the output path.');
        }
        logger_1.logger.debug('Processing image %s to %s.', path, destination);
        const buf = yield fs_extra_1.readFile(path);
        const sharpInstance = sharp(buf);
        yield fs_extra_1.remove(destination);
        yield sharpInstance
            .resize(newSize.width, newSize.height)
            .toFile(destination);
        if (keepOriginal !== true)
            yield fs_extra_1.remove(path);
    });
}
exports.processImage = processImage;
