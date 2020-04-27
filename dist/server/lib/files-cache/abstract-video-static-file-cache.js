"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const logger_1 = require("../../helpers/logger");
const memoizee = require("memoizee");
class AbstractVideoStaticFileCache {
    init(max, maxAge) {
        this.getFilePath = memoizee(this.getFilePathImpl, {
            maxAge,
            max,
            promise: true,
            dispose: (result) => {
                if (result && result.isOwned !== true) {
                    fs_extra_1.remove(result.path)
                        .then(() => logger_1.logger.debug('%s removed from %s', result.path, this.constructor.name))
                        .catch(err => logger_1.logger.error('Cannot remove %s from cache %s.', result.path, this.constructor.name, { err }));
                }
            }
        });
    }
}
exports.AbstractVideoStaticFileCache = AbstractVideoStaticFileCache;
