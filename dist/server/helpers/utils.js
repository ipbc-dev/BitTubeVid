"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUUIDFromFilename = exports.generateVideoImportTmpPath = exports.getServerCommit = exports.getSecureTorrentName = exports.getFormattedObjects = exports.generateRandomString = exports.deleteFileAsync = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const config_1 = require("../initializers/config");
const core_utils_1 = require("./core-utils");
const logger_1 = require("./logger");
function deleteFileAsync(path) {
    fs_extra_1.remove(path)
        .catch(err => logger_1.logger.error('Cannot delete the file %s asynchronously.', path, { err }));
}
exports.deleteFileAsync = deleteFileAsync;
function generateRandomString(size) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const raw = yield core_utils_1.randomBytesPromise(size);
        return raw.toString('hex');
    });
}
exports.generateRandomString = generateRandomString;
function getFormattedObjects(objects, objectsTotal, formattedArg) {
    const formattedObjects = objects.map(o => o.toFormattedJSON(formattedArg));
    return {
        total: objectsTotal,
        data: formattedObjects
    };
}
exports.getFormattedObjects = getFormattedObjects;
function generateVideoImportTmpPath(target, extension = '.mp4') {
    const id = typeof target === 'string'
        ? target
        : target.infoHash;
    const hash = core_utils_1.sha256(id);
    return path_1.join(config_1.CONFIG.STORAGE.TMP_DIR, `${hash}-import${extension}`);
}
exports.generateVideoImportTmpPath = generateVideoImportTmpPath;
function getSecureTorrentName(originalName) {
    return core_utils_1.sha256(originalName) + '.torrent';
}
exports.getSecureTorrentName = getSecureTorrentName;
function getServerCommit() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const tag = yield core_utils_1.execPromise2('[ ! -d .git ] || git name-rev --name-only --tags --no-undefined HEAD 2>/dev/null || true', { stdio: [0, 1, 2] });
            if (tag)
                return tag.replace(/^v/, '');
        }
        catch (err) {
            logger_1.logger.debug('Cannot get version from git tags.', { err });
        }
        try {
            const version = yield core_utils_1.execPromise('[ ! -d .git ] || git rev-parse --short HEAD');
            if (version)
                return version.toString().trim();
        }
        catch (err) {
            logger_1.logger.debug('Cannot get version from git HEAD.', { err });
        }
        return '';
    });
}
exports.getServerCommit = getServerCommit;
function getUUIDFromFilename(filename) {
    const regex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
    const result = filename.match(regex);
    if (!result || Array.isArray(result) === false)
        return null;
    return result[0];
}
exports.getUUIDFromFilename = getUUIDFromFilename;
