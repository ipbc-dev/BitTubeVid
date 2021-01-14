"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideoCaption = exports.testCaptionFile = exports.listVideoCaptions = exports.createVideoCaption = void 0;
const tslib_1 = require("tslib");
const requests_1 = require("../requests/requests");
const request = require("supertest");
const chai = require("chai");
const miscs_1 = require("../miscs/miscs");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
function createVideoCaption(args) {
    const path = '/api/v1/videos/' + args.videoId + '/captions/' + args.language;
    const captionfile = miscs_1.buildAbsoluteFixturePath(args.fixture);
    const captionfileAttach = args.mimeType ? [captionfile, { contentType: args.mimeType }] : captionfile;
    return requests_1.makeUploadRequest({
        method: 'PUT',
        url: args.url,
        path,
        token: args.accessToken,
        fields: {},
        attaches: {
            captionfile: captionfileAttach
        },
        statusCodeExpected: args.statusCodeExpected || http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.createVideoCaption = createVideoCaption;
function listVideoCaptions(url, videoId) {
    const path = '/api/v1/videos/' + videoId + '/captions';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.listVideoCaptions = listVideoCaptions;
function deleteVideoCaption(url, token, videoId, language) {
    const path = '/api/v1/videos/' + videoId + '/captions/' + language;
    return requests_1.makeDeleteRequest({
        url,
        token,
        path,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.deleteVideoCaption = deleteVideoCaption;
function testCaptionFile(url, captionPath, containsString) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield request(url)
            .get(captionPath)
            .expect(http_error_codes_1.HttpStatusCode.OK_200);
        expect(res.text).to.contain(containsString);
    });
}
exports.testCaptionFile = testCaptionFile;
