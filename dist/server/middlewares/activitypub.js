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
const logger_1 = require("../helpers/logger");
const peertube_crypto_1 = require("../helpers/peertube-crypto");
const constants_1 = require("../initializers/constants");
const activitypub_1 = require("../lib/activitypub");
const webfinger_1 = require("../helpers/webfinger");
function checkSignature(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const httpSignatureChecked = yield checkHttpSignature(req, res);
            if (httpSignatureChecked !== true)
                return;
            const actor = res.locals.signature.actor;
            const bodyActor = req.body.actor;
            const bodyActorId = bodyActor && bodyActor.id ? bodyActor.id : bodyActor;
            if (bodyActorId && bodyActorId !== actor.url) {
                const jsonLDSignatureChecked = yield checkJsonLDSignature(req, res);
                if (jsonLDSignatureChecked !== true)
                    return;
            }
            return next();
        }
        catch (err) {
            logger_1.logger.error('Error in ActivityPub signature checker.', err);
            return res.sendStatus(403);
        }
    });
}
exports.checkSignature = checkSignature;
function executeIfActivityPub(req, res, next) {
    const accepted = req.accepts(constants_1.ACCEPT_HEADERS);
    if (accepted === false || constants_1.ACTIVITY_PUB.POTENTIAL_ACCEPT_HEADERS.indexOf(accepted) === -1) {
        return next('route');
    }
    logger_1.logger.debug('ActivityPub request for %s.', req.url);
    return next();
}
exports.executeIfActivityPub = executeIfActivityPub;
function checkHttpSignature(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const sig = req.headers[constants_1.HTTP_SIGNATURE.HEADER_NAME];
        if (sig && sig.startsWith('Signature ') === true)
            req.headers[constants_1.HTTP_SIGNATURE.HEADER_NAME] = sig.replace(/^Signature /, '');
        const parsed = peertube_crypto_1.parseHTTPSignature(req, constants_1.HTTP_SIGNATURE.CLOCK_SKEW_SECONDS);
        const keyId = parsed.keyId;
        if (!keyId) {
            res.sendStatus(403);
            return false;
        }
        logger_1.logger.debug('Checking HTTP signature of actor %s...', keyId);
        let [actorUrl] = keyId.split('#');
        if (actorUrl.startsWith('acct:')) {
            actorUrl = yield webfinger_1.loadActorUrlOrGetFromWebfinger(actorUrl.replace(/^acct:/, ''));
        }
        const actor = yield activitypub_1.getOrCreateActorAndServerAndModel(actorUrl);
        const verified = peertube_crypto_1.isHTTPSignatureVerified(parsed, actor);
        if (verified !== true) {
            logger_1.logger.warn('Signature from %s is invalid', actorUrl, { parsed });
            res.sendStatus(403);
            return false;
        }
        res.locals.signature = { actor };
        return true;
    });
}
exports.checkHttpSignature = checkHttpSignature;
function checkJsonLDSignature(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const signatureObject = req.body.signature;
        if (!signatureObject || !signatureObject.creator) {
            res.sendStatus(403);
            return false;
        }
        const [creator] = signatureObject.creator.split('#');
        logger_1.logger.debug('Checking JsonLD signature of actor %s...', creator);
        const actor = yield activitypub_1.getOrCreateActorAndServerAndModel(creator);
        const verified = yield peertube_crypto_1.isJsonLDSignatureVerified(actor, req.body);
        if (verified !== true) {
            logger_1.logger.warn('Signature not verified.', req.body);
            res.sendStatus(403);
            return false;
        }
        res.locals.signature = { actor };
        return true;
    });
}
