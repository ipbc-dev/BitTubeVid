"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const constants_1 = require("../../../initializers/constants");
const activitypub_http_utils_1 = require("../../../lib/job-queue/handlers/utils/activitypub-http-utils");
const chai = require("chai");
const activitypub_1 = require("../../../helpers/activitypub");
const activitypub_2 = require("../../../../shared/extra-utils/requests/activitypub");
const peertube_crypto_1 = require("@server/helpers/peertube-crypto");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
function setKeysOfServer(onServer, ofServer, publicKey, privateKey) {
    return Promise.all([
        extra_utils_1.setActorField(onServer.internalServerNumber, 'http://localhost:' + ofServer.port + '/accounts/peertube', 'publicKey', publicKey),
        extra_utils_1.setActorField(onServer.internalServerNumber, 'http://localhost:' + ofServer.port + '/accounts/peertube', 'privateKey', privateKey)
    ]);
}
function getAnnounceWithoutContext(server2) {
    const json = require('./json/peertube/announce-without-context.json');
    const result = {};
    for (const key of Object.keys(json)) {
        if (Array.isArray(json[key])) {
            result[key] = json[key].map(v => v.replace(':9002', `:${server2.port}`));
        }
        else {
            result[key] = json[key].replace(':9002', `:${server2.port}`);
        }
    }
    return result;
}
describe('Test ActivityPub security', function () {
    let servers;
    let url;
    const keys = require('./json/peertube/keys.json');
    const invalidKeys = require('./json/peertube/invalid-keys.json');
    const baseHttpSignature = () => ({
        algorithm: constants_1.HTTP_SIGNATURE.ALGORITHM,
        authorizationHeaderName: constants_1.HTTP_SIGNATURE.HEADER_NAME,
        keyId: 'acct:peertube@localhost:' + servers[1].port,
        key: keys.privateKey,
        headers: constants_1.HTTP_SIGNATURE.HEADERS_TO_SIGN
    });
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(3);
            url = servers[0].url + '/inbox';
            yield setKeysOfServer(servers[0], servers[1], keys.publicKey, keys.privateKey);
            const to = { url: 'http://localhost:' + servers[0].port + '/accounts/peertube' };
            const by = { url: 'http://localhost:' + servers[1].port + '/accounts/peertube', privateKey: keys.privateKey };
            yield activitypub_2.makeFollowRequest(to, by);
        });
    });
    describe('When checking HTTP signature', function () {
        it('Should fail with an invalid digest', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = activitypub_1.activityPubContextify(getAnnounceWithoutContext(servers[1]));
                const headers = {
                    Digest: peertube_crypto_1.buildDigest({ hello: 'coucou' })
                };
                const { response } = yield activitypub_2.makePOSTAPRequest(url, body, baseHttpSignature(), headers);
                expect(response.statusCode).to.equal(http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should fail with an invalid date', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = activitypub_1.activityPubContextify(getAnnounceWithoutContext(servers[1]));
                const headers = activitypub_http_utils_1.buildGlobalHeaders(body);
                headers['date'] = 'Wed, 21 Oct 2015 07:28:00 GMT';
                const { response } = yield activitypub_2.makePOSTAPRequest(url, body, baseHttpSignature(), headers);
                expect(response.statusCode).to.equal(http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should fail with bad keys', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield setKeysOfServer(servers[0], servers[1], invalidKeys.publicKey, invalidKeys.privateKey);
                yield setKeysOfServer(servers[1], servers[1], invalidKeys.publicKey, invalidKeys.privateKey);
                const body = activitypub_1.activityPubContextify(getAnnounceWithoutContext(servers[1]));
                const headers = activitypub_http_utils_1.buildGlobalHeaders(body);
                const { response } = yield activitypub_2.makePOSTAPRequest(url, body, baseHttpSignature(), headers);
                expect(response.statusCode).to.equal(http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should reject requests without appropriate signed headers', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield setKeysOfServer(servers[0], servers[1], keys.publicKey, keys.privateKey);
                yield setKeysOfServer(servers[1], servers[1], keys.publicKey, keys.privateKey);
                const body = activitypub_1.activityPubContextify(getAnnounceWithoutContext(servers[1]));
                const headers = activitypub_http_utils_1.buildGlobalHeaders(body);
                const signatureOptions = baseHttpSignature();
                const badHeadersMatrix = [
                    ['(request-target)', 'date', 'digest'],
                    ['host', 'date', 'digest'],
                    ['(request-target)', 'host', 'digest']
                ];
                for (const badHeaders of badHeadersMatrix) {
                    signatureOptions.headers = badHeaders;
                    const { response } = yield activitypub_2.makePOSTAPRequest(url, body, signatureOptions, headers);
                    expect(response.statusCode).to.equal(http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
                }
            });
        });
        it('Should succeed with a valid HTTP signature', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = activitypub_1.activityPubContextify(getAnnounceWithoutContext(servers[1]));
                const headers = activitypub_http_utils_1.buildGlobalHeaders(body);
                const { response } = yield activitypub_2.makePOSTAPRequest(url, body, baseHttpSignature(), headers);
                expect(response.statusCode).to.equal(http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
            });
        });
    });
    describe('When checking Linked Data Signature', function () {
        before(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield setKeysOfServer(servers[2], servers[2], keys.publicKey, keys.privateKey);
            const to = { url: 'http://localhost:' + servers[0].port + '/accounts/peertube' };
            const by = { url: 'http://localhost:' + servers[2].port + '/accounts/peertube', privateKey: keys.privateKey };
            yield activitypub_2.makeFollowRequest(to, by);
        }));
        it('Should fail with bad keys', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield setKeysOfServer(servers[0], servers[2], invalidKeys.publicKey, invalidKeys.privateKey);
                yield setKeysOfServer(servers[2], servers[2], invalidKeys.publicKey, invalidKeys.privateKey);
                const body = getAnnounceWithoutContext(servers[1]);
                body.actor = 'http://localhost:' + servers[2].port + '/accounts/peertube';
                const signer = { privateKey: invalidKeys.privateKey, url: 'http://localhost:' + servers[2].port + '/accounts/peertube' };
                const signedBody = yield activitypub_1.buildSignedActivity(signer, body);
                const headers = activitypub_http_utils_1.buildGlobalHeaders(signedBody);
                const { response } = yield activitypub_2.makePOSTAPRequest(url, signedBody, baseHttpSignature(), headers);
                expect(response.statusCode).to.equal(http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should fail with an altered body', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield setKeysOfServer(servers[0], servers[2], keys.publicKey, keys.privateKey);
                yield setKeysOfServer(servers[0], servers[2], keys.publicKey, keys.privateKey);
                const body = getAnnounceWithoutContext(servers[1]);
                body.actor = 'http://localhost:' + servers[2].port + '/accounts/peertube';
                const signer = { privateKey: keys.privateKey, url: 'http://localhost:' + servers[2].port + '/accounts/peertube' };
                const signedBody = yield activitypub_1.buildSignedActivity(signer, body);
                signedBody.actor = 'http://localhost:' + servers[2].port + '/account/peertube';
                const headers = activitypub_http_utils_1.buildGlobalHeaders(signedBody);
                const { response } = yield activitypub_2.makePOSTAPRequest(url, signedBody, baseHttpSignature(), headers);
                expect(response.statusCode).to.equal(http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should succeed with a valid signature', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const body = getAnnounceWithoutContext(servers[1]);
                body.actor = 'http://localhost:' + servers[2].port + '/accounts/peertube';
                const signer = { privateKey: keys.privateKey, url: 'http://localhost:' + servers[2].port + '/accounts/peertube' };
                const signedBody = yield activitypub_1.buildSignedActivity(signer, body);
                const headers = activitypub_http_utils_1.buildGlobalHeaders(signedBody);
                const { response } = yield activitypub_2.makePOSTAPRequest(url, signedBody, baseHttpSignature(), headers);
                expect(response.statusCode).to.equal(http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield extra_utils_1.cleanupTests(servers);
            yield extra_utils_1.closeAllSequelize(servers);
        });
    });
});
