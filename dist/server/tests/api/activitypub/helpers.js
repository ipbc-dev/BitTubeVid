"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai_1 = require("chai");
const stubs_1 = require("../../../../shared/extra-utils/miscs/stubs");
const peertube_crypto_1 = require("../../../helpers/peertube-crypto");
const lodash_1 = require("lodash");
const activitypub_1 = require("../../../helpers/activitypub");
describe('Test activity pub helpers', function () {
    describe('When checking the Linked Signature', function () {
        it('Should fail with an invalid Mastodon signature', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = require('./json/mastodon/create-bad-signature.json');
                const publicKey = require('./json/mastodon/public-key.json').publicKey;
                const fromActor = { publicKey, url: 'http://localhost:9002/accounts/peertube' };
                const result = yield peertube_crypto_1.isJsonLDSignatureVerified(fromActor, body);
                chai_1.expect(result).to.be.false;
            });
        });
        it('Should fail with an invalid public key', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = require('./json/mastodon/create.json');
                const publicKey = require('./json/mastodon/bad-public-key.json').publicKey;
                const fromActor = { publicKey, url: 'http://localhost:9002/accounts/peertube' };
                const result = yield peertube_crypto_1.isJsonLDSignatureVerified(fromActor, body);
                chai_1.expect(result).to.be.false;
            });
        });
        it('Should succeed with a valid Mastodon signature', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = require('./json/mastodon/create.json');
                const publicKey = require('./json/mastodon/public-key.json').publicKey;
                const fromActor = { publicKey, url: 'http://localhost:9002/accounts/peertube' };
                const result = yield peertube_crypto_1.isJsonLDSignatureVerified(fromActor, body);
                chai_1.expect(result).to.be.true;
            });
        });
        it('Should fail with an invalid PeerTube signature', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const keys = require('./json/peertube/invalid-keys.json');
                const body = require('./json/peertube/announce-without-context.json');
                const actorSignature = { url: 'http://localhost:9002/accounts/peertube', privateKey: keys.privateKey };
                const signedBody = yield activitypub_1.buildSignedActivity(actorSignature, body);
                const fromActor = { publicKey: keys.publicKey, url: 'http://localhost:9002/accounts/peertube' };
                const result = yield peertube_crypto_1.isJsonLDSignatureVerified(fromActor, signedBody);
                chai_1.expect(result).to.be.false;
            });
        });
        it('Should succeed with a valid PeerTube signature', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const keys = require('./json/peertube/keys.json');
                const body = require('./json/peertube/announce-without-context.json');
                const actorSignature = { url: 'http://localhost:9002/accounts/peertube', privateKey: keys.privateKey };
                const signedBody = yield activitypub_1.buildSignedActivity(actorSignature, body);
                const fromActor = { publicKey: keys.publicKey, url: 'http://localhost:9002/accounts/peertube' };
                const result = yield peertube_crypto_1.isJsonLDSignatureVerified(fromActor, signedBody);
                chai_1.expect(result).to.be.true;
            });
        });
    });
    describe('When checking HTTP signature', function () {
        it('Should fail with an invalid http signature', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const req = stubs_1.buildRequestStub();
                req.method = 'POST';
                req.url = '/accounts/ronan/inbox';
                const mastodonObject = lodash_1.cloneDeep(require('./json/mastodon/bad-http-signature.json'));
                req.body = mastodonObject.body;
                req.headers = mastodonObject.headers;
                const parsed = peertube_crypto_1.parseHTTPSignature(req, 3600 * 1000 * 365 * 10);
                const publicKey = require('./json/mastodon/public-key.json').publicKey;
                const actor = { publicKey };
                const verified = peertube_crypto_1.isHTTPSignatureVerified(parsed, actor);
                chai_1.expect(verified).to.be.false;
            });
        });
        it('Should fail with an invalid public key', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const req = stubs_1.buildRequestStub();
                req.method = 'POST';
                req.url = '/accounts/ronan/inbox';
                const mastodonObject = lodash_1.cloneDeep(require('./json/mastodon/http-signature.json'));
                req.body = mastodonObject.body;
                req.headers = mastodonObject.headers;
                const parsed = peertube_crypto_1.parseHTTPSignature(req, 3600 * 1000 * 365 * 10);
                const publicKey = require('./json/mastodon/bad-public-key.json').publicKey;
                const actor = { publicKey };
                const verified = peertube_crypto_1.isHTTPSignatureVerified(parsed, actor);
                chai_1.expect(verified).to.be.false;
            });
        });
        it('Should fail because of clock skew', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const req = stubs_1.buildRequestStub();
                req.method = 'POST';
                req.url = '/accounts/ronan/inbox';
                const mastodonObject = lodash_1.cloneDeep(require('./json/mastodon/http-signature.json'));
                req.body = mastodonObject.body;
                req.headers = mastodonObject.headers;
                let errored = false;
                try {
                    peertube_crypto_1.parseHTTPSignature(req);
                }
                catch (_a) {
                    errored = true;
                }
                chai_1.expect(errored).to.be.true;
            });
        });
        it('Should with a scheme', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const req = stubs_1.buildRequestStub();
                req.method = 'POST';
                req.url = '/accounts/ronan/inbox';
                const mastodonObject = lodash_1.cloneDeep(require('./json/mastodon/http-signature.json'));
                req.body = mastodonObject.body;
                req.headers = mastodonObject.headers;
                req.headers = 'Signature ' + mastodonObject.headers;
                let errored = false;
                try {
                    peertube_crypto_1.parseHTTPSignature(req, 3600 * 1000 * 365 * 10);
                }
                catch (_a) {
                    errored = true;
                }
                chai_1.expect(errored).to.be.true;
            });
        });
        it('Should succeed with a valid signature', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const req = stubs_1.buildRequestStub();
                req.method = 'POST';
                req.url = '/accounts/ronan/inbox';
                const mastodonObject = lodash_1.cloneDeep(require('./json/mastodon/http-signature.json'));
                req.body = mastodonObject.body;
                req.headers = mastodonObject.headers;
                const parsed = peertube_crypto_1.parseHTTPSignature(req, 3600 * 1000 * 365 * 10);
                const publicKey = require('./json/mastodon/public-key.json').publicKey;
                const actor = { publicKey };
                const verified = peertube_crypto_1.isHTTPSignatureVerified(parsed, actor);
                chai_1.expect(verified).to.be.true;
            });
        });
    });
});
