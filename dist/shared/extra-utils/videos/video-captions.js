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
const requests_1 = require("../requests/requests");
const request = require("supertest");
const chai = require("chai");
const miscs_1 = require("../miscs/miscs");
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
        statusCodeExpected: args.statusCodeExpected || 204
    });
}
exports.createVideoCaption = createVideoCaption;
function listVideoCaptions(url, videoId) {
    const path = '/api/v1/videos/' + videoId + '/captions';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: 200
    });
}
exports.listVideoCaptions = listVideoCaptions;
function deleteVideoCaption(url, token, videoId, language) {
    const path = '/api/v1/videos/' + videoId + '/captions/' + language;
    return requests_1.makeDeleteRequest({
        url,
        token,
        path,
        statusCodeExpected: 204
    });
}
exports.deleteVideoCaption = deleteVideoCaption;
function testCaptionFile(url, captionPath, containsString) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request(url)
            .get(captionPath)
            .expect(200);
        expect(res.text).to.contain(containsString);
    });
}
exports.testCaptionFile = testCaptionFile;
