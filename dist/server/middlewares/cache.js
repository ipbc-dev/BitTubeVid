"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheRoute = void 0;
const redis_1 = require("../lib/redis");
const apicache = require("apicache");
const http_error_codes_1 = require("../../shared/core-utils/miscs/http-error-codes");
redis_1.Redis.Instance.init();
const defaultOptions = {
    redisClient: redis_1.Redis.Instance.getClient(),
    appendKey: () => redis_1.Redis.Instance.getPrefix(),
    statusCodes: {
        exclude: [
            http_error_codes_1.HttpStatusCode.FORBIDDEN_403,
            http_error_codes_1.HttpStatusCode.NOT_FOUND_404
        ]
    }
};
const cacheRoute = (extraOptions = {}) => apicache.options(Object.assign(Object.assign({}, defaultOptions), extraOptions)).middleware;
exports.cacheRoute = cacheRoute;
