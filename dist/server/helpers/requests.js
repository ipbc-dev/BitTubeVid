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
const Bluebird = require("bluebird");
const fs_extra_1 = require("fs-extra");
const request = require("request");
const constants_1 = require("../initializers/constants");
const image_utils_1 = require("./image-utils");
const path_1 = require("path");
const logger_1 = require("./logger");
const config_1 = require("../initializers/config");
function doRequest(requestOptions, bodyKBLimit = 1000) {
    if (!(requestOptions.headers))
        requestOptions.headers = {};
    requestOptions.headers['User-Agent'] = getUserAgent();
    if (requestOptions.activityPub === true) {
        requestOptions.headers['accept'] = constants_1.ACTIVITY_PUB.ACCEPT_HEADER;
    }
    return new Bluebird((res, rej) => {
        request(requestOptions, (err, response, body) => err ? rej(err) : res({ response, body }))
            .on('data', onRequestDataLengthCheck(bodyKBLimit));
    });
}
exports.doRequest = doRequest;
function doRequestAndSaveToFile(requestOptions, destPath, bodyKBLimit = 10000) {
    if (!requestOptions.headers)
        requestOptions.headers = {};
    requestOptions.headers['User-Agent'] = getUserAgent();
    return new Bluebird((res, rej) => {
        const file = fs_extra_1.createWriteStream(destPath);
        file.on('finish', () => res());
        request(requestOptions)
            .on('data', onRequestDataLengthCheck(bodyKBLimit))
            .on('error', err => {
            file.close();
            fs_extra_1.remove(destPath)
                .catch(err => logger_1.logger.error('Cannot remove %s after request failure.', destPath, { err }));
            return rej(err);
        })
            .pipe(file);
    });
}
exports.doRequestAndSaveToFile = doRequestAndSaveToFile;
function downloadImage(url, destDir, destName, size) {
    return __awaiter(this, void 0, void 0, function* () {
        const tmpPath = path_1.join(config_1.CONFIG.STORAGE.TMP_DIR, 'pending-' + destName);
        yield doRequestAndSaveToFile({ method: 'GET', uri: url }, tmpPath);
        const destPath = path_1.join(destDir, destName);
        try {
            yield image_utils_1.processImage(tmpPath, destPath, size);
        }
        catch (err) {
            yield fs_extra_1.remove(tmpPath);
            throw err;
        }
    });
}
exports.downloadImage = downloadImage;
function getUserAgent() {
    return `PeerTube/${constants_1.PEERTUBE_VERSION} (+${constants_1.WEBSERVER.URL})`;
}
function onRequestDataLengthCheck(bodyKBLimit) {
    let bufferLength = 0;
    const bytesLimit = bodyKBLimit * 1000;
    return function (chunk) {
        bufferLength += chunk.length;
        if (bufferLength > bytesLimit) {
            this.abort();
            const error = new Error(`Response was too large - aborted after ${bytesLimit} bytes.`);
            this.emit('error', error);
        }
    };
}
