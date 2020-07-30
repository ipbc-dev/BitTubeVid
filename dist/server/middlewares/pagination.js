"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultPagination = void 0;
const constants_1 = require("../initializers/constants");
function setDefaultPagination(req, res, next) {
    if (!req.query.start)
        req.query.start = 0;
    else
        req.query.start = parseInt(req.query.start, 10);
    if (!req.query.count)
        req.query.count = constants_1.PAGINATION.GLOBAL.COUNT.DEFAULT;
    else
        req.query.count = parseInt(req.query.count, 10);
    return next();
}
exports.setDefaultPagination = setDefaultPagination;
