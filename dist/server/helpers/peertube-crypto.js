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
const constants_1 = require("../initializers/constants");
const core_utils_1 = require("./core-utils");
const custom_jsonld_signature_1 = require("./custom-jsonld-signature");
const logger_1 = require("./logger");
const lodash_1 = require("lodash");
const crypto_1 = require("crypto");
const activitypub_http_utils_1 = require("../lib/job-queue/handlers/utils/activitypub-http-utils");
const bcrypt = require("bcrypt");
const bcryptComparePromise = core_utils_1.promisify2(bcrypt.compare);
const bcryptGenSaltPromise = core_utils_1.promisify1(bcrypt.genSalt);
const bcryptHashPromise = core_utils_1.promisify2(bcrypt.hash);
const httpSignature = require('http-signature');
function createPrivateAndPublicKeys() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Generating a RSA key...');
        const { key } = yield core_utils_1.createPrivateKey(constants_1.PRIVATE_RSA_KEY_SIZE);
        const { publicKey } = yield core_utils_1.getPublicKey(key);
        return { privateKey: key, publicKey };
    });
}
exports.createPrivateAndPublicKeys = createPrivateAndPublicKeys;
function comparePassword(plainPassword, hashPassword) {
    return bcryptComparePromise(plainPassword, hashPassword);
}
exports.comparePassword = comparePassword;
function cryptPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        const salt = yield bcryptGenSaltPromise(constants_1.BCRYPT_SALT_SIZE);
        return bcryptHashPromise(password, salt);
    });
}
exports.cryptPassword = cryptPassword;
function isHTTPSignatureDigestValid(rawBody, req) {
    if (req.headers[constants_1.HTTP_SIGNATURE.HEADER_NAME] && req.headers['digest']) {
        return activitypub_http_utils_1.buildDigest(rawBody.toString()) === req.headers['digest'];
    }
    return true;
}
exports.isHTTPSignatureDigestValid = isHTTPSignatureDigestValid;
function isHTTPSignatureVerified(httpSignatureParsed, actor) {
    return httpSignature.verifySignature(httpSignatureParsed, actor.publicKey) === true;
}
exports.isHTTPSignatureVerified = isHTTPSignatureVerified;
function parseHTTPSignature(req, clockSkew) {
    return httpSignature.parse(req, { clockSkew });
}
exports.parseHTTPSignature = parseHTTPSignature;
function isJsonLDSignatureVerified(fromActor, signedDocument) {
    if (signedDocument.signature.type === 'RsaSignature2017') {
        return isJsonLDRSA2017Verified(fromActor, signedDocument);
    }
    logger_1.logger.warn('Unknown JSON LD signature %s.', signedDocument.signature.type, signedDocument);
    return Promise.resolve(false);
}
exports.isJsonLDSignatureVerified = isJsonLDSignatureVerified;
function isJsonLDRSA2017Verified(fromActor, signedDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        const [documentHash, optionsHash] = yield Promise.all([
            createDocWithoutSignatureHash(signedDocument),
            createSignatureHash(signedDocument.signature)
        ]);
        const toVerify = optionsHash + documentHash;
        const verify = crypto_1.createVerify('RSA-SHA256');
        verify.update(toVerify, 'utf8');
        return verify.verify(fromActor.publicKey, signedDocument.signature.signatureValue, 'base64');
    });
}
function signJsonLDObject(byActor, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const signature = {
            type: 'RsaSignature2017',
            creator: byActor.url,
            created: new Date().toISOString()
        };
        const [documentHash, optionsHash] = yield Promise.all([
            createDocWithoutSignatureHash(data),
            createSignatureHash(signature)
        ]);
        const toSign = optionsHash + documentHash;
        const sign = crypto_1.createSign('RSA-SHA256');
        sign.update(toSign, 'utf8');
        const signatureValue = sign.sign(byActor.privateKey, 'base64');
        Object.assign(signature, { signatureValue });
        return Object.assign(data, { signature });
    });
}
exports.signJsonLDObject = signJsonLDObject;
function hash(obj) {
    return custom_jsonld_signature_1.jsonld.promises
        .normalize(obj, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads'
    })
        .then(res => core_utils_1.sha256(res));
}
function createSignatureHash(signature) {
    const signatureCopy = lodash_1.cloneDeep(signature);
    Object.assign(signatureCopy, {
        '@context': [
            'https://w3id.org/security/v1',
            { RsaSignature2017: 'https://w3id.org/security#RsaSignature2017' }
        ]
    });
    delete signatureCopy.type;
    delete signatureCopy.id;
    delete signatureCopy.signatureValue;
    return hash(signatureCopy);
}
function createDocWithoutSignatureHash(doc) {
    const docWithoutSignature = lodash_1.cloneDeep(doc);
    delete docWithoutSignature.signature;
    return hash(docWithoutSignature);
}
