"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkRemoveCommentsOf = void 0;
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function bulkRemoveCommentsOf(options) {
    const { url, token, attributes, expectedStatus } = options;
    const path = '/api/v1/bulk/remove-comments-of';
    return requests_1.makePostBodyRequest({
        url,
        path,
        token,
        fields: attributes,
        statusCodeExpected: expectedStatus || http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.bulkRemoveCommentsOf = bulkRemoveCommentsOf;
