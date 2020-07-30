"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFetchOutboxJob = exports.updateActorAvatarInstance = exports.refreshActorIfNeeded = exports.updateActorInstance = exports.getAvatarInfoIfExists = exports.fetchActorTotalItems = exports.setAsyncActorKeys = exports.buildActorInstance = exports.getOrCreateActorAndServerAndModel = void 0;
const tslib_1 = require("tslib");
const url_1 = require("url");
const uuid_1 = require("uuid");
const activitypub_1 = require("../../helpers/activitypub");
const actor_1 = require("../../helpers/custom-validators/activitypub/actor");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
const database_utils_1 = require("../../helpers/database-utils");
const logger_1 = require("../../helpers/logger");
const peertube_crypto_1 = require("../../helpers/peertube-crypto");
const requests_1 = require("../../helpers/requests");
const webfinger_1 = require("../../helpers/webfinger");
const constants_1 = require("../../initializers/constants");
const account_1 = require("../../models/account/account");
const actor_2 = require("../../models/activitypub/actor");
const avatar_1 = require("../../models/avatar/avatar");
const server_1 = require("../../models/server/server");
const video_channel_1 = require("../../models/video/video-channel");
const job_queue_1 = require("../job-queue");
const actor_3 = require("../../helpers/actor");
const database_1 = require("../../initializers/database");
const path_1 = require("path");
const application_1 = require("@server/models/application/application");
function setAsyncActorKeys(actor) {
    return peertube_crypto_1.createPrivateAndPublicKeys()
        .then(({ publicKey, privateKey }) => {
        actor.publicKey = publicKey;
        actor.privateKey = privateKey;
        return actor.save();
    })
        .catch(err => {
        logger_1.logger.error('Cannot set public/private keys of actor %d.', actor.url, { err });
        return actor;
    });
}
exports.setAsyncActorKeys = setAsyncActorKeys;
function getOrCreateActorAndServerAndModel(activityActor, fetchType = 'association-ids', recurseIfNeeded = true, updateCollections = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const actorUrl = activitypub_1.getAPId(activityActor);
        let created = false;
        let accountPlaylistsUrl;
        let actor = yield actor_3.fetchActorByUrl(actorUrl, fetchType);
        if (actor && (!actor.Account && !actor.VideoChannel)) {
            yield actor.destroy();
            actor = null;
        }
        if (!actor) {
            const { result } = yield fetchRemoteActor(actorUrl);
            if (result === undefined)
                throw new Error('Cannot fetch remote actor ' + actorUrl);
            let ownerActor;
            if (recurseIfNeeded === true && result.actor.type === 'Group') {
                const accountAttributedTo = result.attributedTo.find(a => a.type === 'Person');
                if (!accountAttributedTo)
                    throw new Error('Cannot find account attributed to video channel ' + actor.url);
                if (activitypub_1.checkUrlsSameHost(accountAttributedTo.id, actorUrl) !== true) {
                    throw new Error(`Account attributed to ${accountAttributedTo.id} does not have the same host than actor url ${actorUrl}`);
                }
                try {
                    const recurseIfNeeded = false;
                    ownerActor = yield getOrCreateActorAndServerAndModel(accountAttributedTo.id, 'all', recurseIfNeeded);
                }
                catch (err) {
                    logger_1.logger.error('Cannot get or create account attributed to video channel ' + actor.url);
                    throw new Error(err);
                }
            }
            actor = yield database_utils_1.retryTransactionWrapper(saveActorAndServerAndModelIfNotExist, result, ownerActor);
            created = true;
            accountPlaylistsUrl = result.playlists;
        }
        if (actor.Account)
            actor.Account.Actor = actor;
        if (actor.VideoChannel)
            actor.VideoChannel.Actor = actor;
        const { actor: actorRefreshed, refreshed } = yield database_utils_1.retryTransactionWrapper(refreshActorIfNeeded, actor, fetchType);
        if (!actorRefreshed)
            throw new Error('Actor ' + actor.url + ' does not exist anymore.');
        if ((created === true || refreshed === true) && updateCollections === true) {
            const payload = { uri: actor.outboxUrl, type: 'activity' };
            yield job_queue_1.JobQueue.Instance.createJobWithPromise({ type: 'activitypub-http-fetcher', payload });
        }
        if (created === true && actor.Account && accountPlaylistsUrl) {
            const payload = { uri: accountPlaylistsUrl, accountId: actor.Account.id, type: 'account-playlists' };
            yield job_queue_1.JobQueue.Instance.createJobWithPromise({ type: 'activitypub-http-fetcher', payload });
        }
        return actorRefreshed;
    });
}
exports.getOrCreateActorAndServerAndModel = getOrCreateActorAndServerAndModel;
function buildActorInstance(type, url, preferredUsername, uuid) {
    return new actor_2.ActorModel({
        type,
        url,
        preferredUsername,
        uuid,
        publicKey: null,
        privateKey: null,
        followersCount: 0,
        followingCount: 0,
        inboxUrl: url + '/inbox',
        outboxUrl: url + '/outbox',
        sharedInboxUrl: constants_1.WEBSERVER.URL + '/inbox',
        followersUrl: url + '/followers',
        followingUrl: url + '/following'
    });
}
exports.buildActorInstance = buildActorInstance;
function updateActorInstance(actorInstance, attributes) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const followersCount = yield fetchActorTotalItems(attributes.followers);
        const followingCount = yield fetchActorTotalItems(attributes.following);
        actorInstance.type = attributes.type;
        actorInstance.preferredUsername = attributes.preferredUsername;
        actorInstance.url = attributes.id;
        actorInstance.publicKey = attributes.publicKey.publicKeyPem;
        actorInstance.followersCount = followersCount;
        actorInstance.followingCount = followingCount;
        actorInstance.inboxUrl = attributes.inbox;
        actorInstance.outboxUrl = attributes.outbox;
        actorInstance.followersUrl = attributes.followers;
        actorInstance.followingUrl = attributes.following;
        if ((_a = attributes.endpoints) === null || _a === void 0 ? void 0 : _a.sharedInbox) {
            actorInstance.sharedInboxUrl = attributes.endpoints.sharedInbox;
        }
    });
}
exports.updateActorInstance = updateActorInstance;
function updateActorAvatarInstance(actor, info, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!info.name)
            return actor;
        if (actor.Avatar) {
            if (info.fileUrl && actor.Avatar.fileUrl === info.fileUrl)
                return actor;
            try {
                yield actor.Avatar.destroy({ transaction: t });
            }
            catch (err) {
                logger_1.logger.error('Cannot remove old avatar of actor %s.', actor.url, { err });
            }
        }
        const avatar = yield avatar_1.AvatarModel.create({
            filename: info.name,
            onDisk: info.onDisk,
            fileUrl: info.fileUrl
        }, { transaction: t });
        actor.avatarId = avatar.id;
        actor.Avatar = avatar;
        return actor;
    });
}
exports.updateActorAvatarInstance = updateActorAvatarInstance;
function fetchActorTotalItems(url) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = {
            uri: url,
            method: 'GET',
            json: true,
            activityPub: true
        };
        try {
            const { body } = yield requests_1.doRequest(options);
            return body.totalItems ? body.totalItems : 0;
        }
        catch (err) {
            logger_1.logger.warn('Cannot fetch remote actor count %s.', url, { err });
            return 0;
        }
    });
}
exports.fetchActorTotalItems = fetchActorTotalItems;
function getAvatarInfoIfExists(actorJSON) {
    const mimetypes = constants_1.MIMETYPES.IMAGE;
    const icon = actorJSON.icon;
    if (!icon || icon.type !== 'Image' || !misc_1.isActivityPubUrlValid(icon.url))
        return undefined;
    let extension;
    if (icon.mediaType) {
        extension = mimetypes.MIMETYPE_EXT[icon.mediaType];
    }
    else {
        const tmp = path_1.extname(icon.url);
        if (mimetypes.EXT_MIMETYPE[tmp] !== undefined)
            extension = tmp;
    }
    if (!extension)
        return undefined;
    return {
        name: uuid_1.v4() + extension,
        fileUrl: icon.url
    };
}
exports.getAvatarInfoIfExists = getAvatarInfoIfExists;
function addFetchOutboxJob(actor) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        if (serverActor.id === actor.id) {
            logger_1.logger.error('Cannot fetch our own outbox!');
            return undefined;
        }
        const payload = {
            uri: actor.outboxUrl,
            type: 'activity'
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-http-fetcher', payload });
    });
}
exports.addFetchOutboxJob = addFetchOutboxJob;
function refreshActorIfNeeded(actorArg, fetchedType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!actorArg.isOutdated())
            return { actor: actorArg, refreshed: false };
        const actor = fetchedType === 'all'
            ? actorArg
            : yield actor_2.ActorModel.loadByUrlAndPopulateAccountAndChannel(actorArg.url);
        try {
            let actorUrl;
            try {
                actorUrl = yield webfinger_1.getUrlFromWebfinger(actor.preferredUsername + '@' + actor.getHost());
            }
            catch (err) {
                logger_1.logger.warn('Cannot get actor URL from webfinger, keeping the old one.', err);
                actorUrl = actor.url;
            }
            const { result, statusCode } = yield fetchRemoteActor(actorUrl);
            if (statusCode === 404) {
                logger_1.logger.info('Deleting actor %s because there is a 404 in refresh actor.', actor.url);
                actor.Account
                    ? yield actor.Account.destroy()
                    : yield actor.VideoChannel.destroy();
                return { actor: undefined, refreshed: false };
            }
            if (result === undefined) {
                logger_1.logger.warn('Cannot fetch remote actor in refresh actor.');
                return { actor, refreshed: false };
            }
            return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                database_utils_1.updateInstanceWithAnother(actor, result.actor);
                if (result.avatar !== undefined) {
                    const avatarInfo = {
                        name: result.avatar.name,
                        fileUrl: result.avatar.fileUrl,
                        onDisk: false
                    };
                    yield updateActorAvatarInstance(actor, avatarInfo, t);
                }
                actor.setDataValue('updatedAt', new Date());
                yield actor.save({ transaction: t });
                if (actor.Account) {
                    actor.Account.name = result.name;
                    actor.Account.description = result.summary;
                    yield actor.Account.save({ transaction: t });
                }
                else if (actor.VideoChannel) {
                    actor.VideoChannel.name = result.name;
                    actor.VideoChannel.description = result.summary;
                    actor.VideoChannel.support = result.support;
                    yield actor.VideoChannel.save({ transaction: t });
                }
                return { refreshed: true, actor };
            }));
        }
        catch (err) {
            logger_1.logger.warn('Cannot refresh actor %s.', actor.url, { err });
            return { actor, refreshed: false };
        }
    });
}
exports.refreshActorIfNeeded = refreshActorIfNeeded;
function saveActorAndServerAndModelIfNotExist(result, ownerActor, t) {
    const actor = result.actor;
    if (t !== undefined)
        return save(t);
    return database_1.sequelizeTypescript.transaction(t => save(t));
    function save(t) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const actorHost = new url_1.URL(actor.url).host;
            const serverOptions = {
                where: {
                    host: actorHost
                },
                defaults: {
                    host: actorHost
                },
                transaction: t
            };
            const [server] = yield server_1.ServerModel.findOrCreate(serverOptions);
            actor.serverId = server.id;
            if (result.avatar) {
                const avatar = yield avatar_1.AvatarModel.create({
                    filename: result.avatar.name,
                    fileUrl: result.avatar.fileUrl,
                    onDisk: false
                }, { transaction: t });
                actor.avatarId = avatar.id;
            }
            const [actorCreated] = yield actor_2.ActorModel.findOrCreate({
                defaults: actor.toJSON(),
                where: {
                    url: actor.url
                },
                transaction: t
            });
            if (actorCreated.type === 'Person' || actorCreated.type === 'Application') {
                actorCreated.Account = (yield saveAccount(actorCreated, result, t));
                actorCreated.Account.Actor = actorCreated;
            }
            else if (actorCreated.type === 'Group') {
                const channel = yield saveVideoChannel(actorCreated, result, ownerActor, t);
                actorCreated.VideoChannel = Object.assign(channel, { Actor: actorCreated, Account: ownerActor.Account });
            }
            actorCreated.Server = server;
            return actorCreated;
        });
    }
}
function fetchRemoteActor(actorUrl) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = {
            uri: actorUrl,
            method: 'GET',
            json: true,
            activityPub: true
        };
        logger_1.logger.info('Fetching remote actor %s.', actorUrl);
        const requestResult = yield requests_1.doRequest(options);
        const actorJSON = requestResult.body;
        if (actor_1.sanitizeAndCheckActorObject(actorJSON) === false) {
            logger_1.logger.debug('Remote actor JSON is not valid.', { actorJSON });
            return { result: undefined, statusCode: requestResult.response.statusCode };
        }
        if (activitypub_1.checkUrlsSameHost(actorJSON.id, actorUrl) !== true) {
            logger_1.logger.warn('Actor url %s has not the same host than its AP id %s', actorUrl, actorJSON.id);
            return { result: undefined, statusCode: requestResult.response.statusCode };
        }
        const followersCount = yield fetchActorTotalItems(actorJSON.followers);
        const followingCount = yield fetchActorTotalItems(actorJSON.following);
        const actor = new actor_2.ActorModel({
            type: actorJSON.type,
            preferredUsername: actorJSON.preferredUsername,
            url: actorJSON.id,
            publicKey: actorJSON.publicKey.publicKeyPem,
            privateKey: null,
            followersCount: followersCount,
            followingCount: followingCount,
            inboxUrl: actorJSON.inbox,
            outboxUrl: actorJSON.outbox,
            followersUrl: actorJSON.followers,
            followingUrl: actorJSON.following,
            sharedInboxUrl: ((_a = actorJSON.endpoints) === null || _a === void 0 ? void 0 : _a.sharedInbox) ? actorJSON.endpoints.sharedInbox
                : null
        });
        const avatarInfo = yield getAvatarInfoIfExists(actorJSON);
        const name = actorJSON.name || actorJSON.preferredUsername;
        return {
            statusCode: requestResult.response.statusCode,
            result: {
                actor,
                name,
                avatar: avatarInfo,
                summary: actorJSON.summary,
                support: actorJSON.support,
                playlists: actorJSON.playlists,
                attributedTo: actorJSON.attributedTo
            }
        };
    });
}
function saveAccount(actor, result, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const [accountCreated] = yield account_1.AccountModel.findOrCreate({
            defaults: {
                name: result.name,
                description: result.summary,
                actorId: actor.id
            },
            where: {
                actorId: actor.id
            },
            transaction: t
        });
        return accountCreated;
    });
}
function saveVideoChannel(actor, result, ownerActor, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const [videoChannelCreated] = yield video_channel_1.VideoChannelModel.findOrCreate({
            defaults: {
                name: result.name,
                description: result.summary,
                support: result.support,
                actorId: actor.id,
                accountId: ownerActor.Account.id
            },
            where: {
                actorId: actor.id
            },
            transaction: t
        });
        return videoChannelCreated;
    });
}
