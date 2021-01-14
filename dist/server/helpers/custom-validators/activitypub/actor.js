"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidActorHandle = exports.sanitizeAndCheckActorObject = exports.isActorDeleteActivityValid = exports.isActorFollowersCountValid = exports.isActorFollowingCountValid = exports.isActorObjectValid = exports.isActorPrivateKeyValid = exports.isActorPreferredUsernameValid = exports.isActorPublicKeyValid = exports.isActorTypeValid = exports.isActorPublicKeyObjectValid = exports.isActorEndpointsObjectValid = exports.areValidActorHandles = exports.actorNameAlphabet = exports.normalizeActor = void 0;
const validator_1 = require("validator");
const constants_1 = require("../../../initializers/constants");
const misc_1 = require("../misc");
const misc_2 = require("./misc");
const servers_1 = require("../servers");
const core_utils_1 = require("@server/helpers/core-utils");
function isActorEndpointsObjectValid(endpointObject) {
    if (endpointObject === null || endpointObject === void 0 ? void 0 : endpointObject.sharedInbox) {
        return misc_2.isActivityPubUrlValid(endpointObject.sharedInbox);
    }
    return true;
}
exports.isActorEndpointsObjectValid = isActorEndpointsObjectValid;
function isActorPublicKeyObjectValid(publicKeyObject) {
    return misc_2.isActivityPubUrlValid(publicKeyObject.id) &&
        misc_2.isActivityPubUrlValid(publicKeyObject.owner) &&
        isActorPublicKeyValid(publicKeyObject.publicKeyPem);
}
exports.isActorPublicKeyObjectValid = isActorPublicKeyObjectValid;
function isActorTypeValid(type) {
    return type === 'Person' || type === 'Application' || type === 'Group' || type === 'Service' || type === 'Organization';
}
exports.isActorTypeValid = isActorTypeValid;
function isActorPublicKeyValid(publicKey) {
    return misc_1.exists(publicKey) &&
        typeof publicKey === 'string' &&
        publicKey.startsWith('-----BEGIN PUBLIC KEY-----') &&
        publicKey.includes('-----END PUBLIC KEY-----') &&
        validator_1.default.isLength(publicKey, constants_1.CONSTRAINTS_FIELDS.ACTORS.PUBLIC_KEY);
}
exports.isActorPublicKeyValid = isActorPublicKeyValid;
const actorNameAlphabet = '[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\\-_.:]';
exports.actorNameAlphabet = actorNameAlphabet;
const actorNameRegExp = new RegExp(`^${actorNameAlphabet}+$`);
function isActorPreferredUsernameValid(preferredUsername) {
    return misc_1.exists(preferredUsername) && validator_1.default.matches(preferredUsername, actorNameRegExp);
}
exports.isActorPreferredUsernameValid = isActorPreferredUsernameValid;
function isActorPrivateKeyValid(privateKey) {
    return misc_1.exists(privateKey) &&
        typeof privateKey === 'string' &&
        privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----') &&
        privateKey.includes('-----END RSA PRIVATE KEY-----') &&
        validator_1.default.isLength(privateKey, constants_1.CONSTRAINTS_FIELDS.ACTORS.PRIVATE_KEY);
}
exports.isActorPrivateKeyValid = isActorPrivateKeyValid;
function isActorObjectValid(actor) {
    return misc_1.exists(actor) &&
        misc_2.isActivityPubUrlValid(actor.id) &&
        isActorTypeValid(actor.type) &&
        misc_2.isActivityPubUrlValid(actor.inbox) &&
        isActorPreferredUsernameValid(actor.preferredUsername) &&
        misc_2.isActivityPubUrlValid(actor.url) &&
        isActorPublicKeyObjectValid(actor.publicKey) &&
        isActorEndpointsObjectValid(actor.endpoints) &&
        (!actor.outbox || misc_2.isActivityPubUrlValid(actor.outbox)) &&
        (!actor.following || misc_2.isActivityPubUrlValid(actor.following)) &&
        (!actor.followers || misc_2.isActivityPubUrlValid(actor.followers)) &&
        misc_2.setValidAttributedTo(actor) &&
        setValidDescription(actor) &&
        (actor.type !== 'Group' || actor.attributedTo.length !== 0);
}
exports.isActorObjectValid = isActorObjectValid;
function isActorFollowingCountValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt('' + value, { min: 0 });
}
exports.isActorFollowingCountValid = isActorFollowingCountValid;
function isActorFollowersCountValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt('' + value, { min: 0 });
}
exports.isActorFollowersCountValid = isActorFollowersCountValid;
function isActorDeleteActivityValid(activity) {
    return misc_2.isBaseActivityValid(activity, 'Delete');
}
exports.isActorDeleteActivityValid = isActorDeleteActivityValid;
function sanitizeAndCheckActorObject(object) {
    normalizeActor(object);
    return isActorObjectValid(object);
}
exports.sanitizeAndCheckActorObject = sanitizeAndCheckActorObject;
function normalizeActor(actor) {
    if (!actor)
        return;
    if (!actor.url) {
        actor.url = actor.id;
    }
    else if (typeof actor.url !== 'string') {
        actor.url = actor.url.href || actor.url.url;
    }
    if (actor.summary && typeof actor.summary === 'string') {
        actor.summary = core_utils_1.peertubeTruncate(actor.summary, { length: constants_1.CONSTRAINTS_FIELDS.USERS.DESCRIPTION.max });
        if (actor.summary.length < constants_1.CONSTRAINTS_FIELDS.USERS.DESCRIPTION.min) {
            actor.summary = null;
        }
    }
}
exports.normalizeActor = normalizeActor;
function isValidActorHandle(handle) {
    if (!misc_1.exists(handle))
        return false;
    const parts = handle.split('@');
    if (parts.length !== 2)
        return false;
    return servers_1.isHostValid(parts[1]);
}
exports.isValidActorHandle = isValidActorHandle;
function areValidActorHandles(handles) {
    return misc_1.isArray(handles) && handles.every(h => isValidActorHandle(h));
}
exports.areValidActorHandles = areValidActorHandles;
function setValidDescription(obj) {
    if (!obj.summary)
        obj.summary = null;
    return true;
}
