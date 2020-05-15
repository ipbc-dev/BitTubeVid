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
const requests_1 = require("./requests");
const miscs_1 = require("../miscs/miscs");
function checkBadStartPagination(url, path, token, query = {}) {
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        query: miscs_1.immutableAssign(query, { start: 'hello' }),
        statusCodeExpected: 400
    });
}
exports.checkBadStartPagination = checkBadStartPagination;
function checkBadCountPagination(url, path, token, query = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        yield requests_1.makeGetRequest({
            url,
            path,
            token,
            query: miscs_1.immutableAssign(query, { count: 'hello' }),
            statusCodeExpected: 400
        });
        yield requests_1.makeGetRequest({
            url,
            path,
            token,
            query: miscs_1.immutableAssign(query, { count: 2000 }),
            statusCodeExpected: 400
        });
    });
}
exports.checkBadCountPagination = checkBadCountPagination;
function checkBadSortPagination(url, path, token, query = {}) {
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        query: miscs_1.immutableAssign(query, { sort: 'hello' }),
        statusCodeExpected: 400
    });
}
exports.checkBadSortPagination = checkBadSortPagination;
