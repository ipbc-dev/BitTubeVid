"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelCache = void 0;
const Bluebird = require("bluebird");
const logger_1 = require("@server/helpers/logger");
class ModelCache {
    constructor() {
        this.localCache = {
            'local-account-name': new Map(),
            'local-actor-name': new Map(),
            'local-actor-url': new Map(),
            'load-video-immutable-id': new Map(),
            'load-video-immutable-url': new Map()
        };
        this.deleteIds = {
            video: new Map()
        };
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
    doCache(options) {
        const { cacheType, key, fun, whitelist, deleteKey } = options;
        if (whitelist && whitelist() !== true)
            return fun();
        const cache = this.localCache[cacheType];
        if (cache.has(key)) {
            logger_1.logger.debug('Model cache hit for %s -> %s.', cacheType, key);
            return Bluebird.resolve(cache.get(key));
        }
        return fun().then(m => {
            if (!m)
                return m;
            if (!whitelist || whitelist())
                cache.set(key, m);
            if (deleteKey) {
                const map = this.deleteIds[deleteKey];
                if (!map.has(m.id))
                    map.set(m.id, []);
                const a = map.get(m.id);
                a.push({ cacheType, key });
            }
            return m;
        });
    }
    invalidateCache(deleteKey, modelId) {
        const map = this.deleteIds[deleteKey];
        if (!map.has(modelId))
            return;
        for (const toDelete of map.get(modelId)) {
            logger_1.logger.debug('Removing %s -> %d of model cache %s -> %s.', deleteKey, modelId, toDelete.cacheType, toDelete.key);
            this.localCache[toDelete.cacheType].delete(toDelete.key);
        }
        map.delete(modelId);
    }
}
exports.ModelCache = ModelCache;
