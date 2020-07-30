"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheRoute = void 0;
const redis_1 = require("../lib/redis");
const apicache = require("apicache");
redis_1.Redis.Instance.init();
const defaultOptions = {
    redisClient: redis_1.Redis.Instance.getClient(),
    appendKey: () => redis_1.Redis.Instance.getPrefix(),
    statusCodes: {
        exclude: [404, 403]
    }
};
const cacheRoute = (extraOptions = {}) => apicache.options(Object.assign(Object.assign({}, defaultOptions), extraOptions)).middleware;
exports.cacheRoute = cacheRoute;
