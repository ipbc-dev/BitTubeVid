"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushAvatarProcessInQueue = exports.deleteLocalActorAvatarFile = exports.updateLocalActorAvatarFile = exports.avatarPathUnsafeCache = void 0;
const tslib_1 = require("tslib");
require("multer");
const send_1 = require("./activitypub/send");
const constants_1 = require("../initializers/constants");
const actor_1 = require("./activitypub/actor");
const image_utils_1 = require("../helpers/image-utils");
const path_1 = require("path");
const database_utils_1 = require("../helpers/database-utils");
const uuid_1 = require("uuid");
const config_1 = require("../initializers/config");
const database_1 = require("../initializers/database");
const LRUCache = require("lru-cache");
const async_1 = require("async");
const requests_1 = require("../helpers/requests");
function updateLocalActorAvatarFile(accountOrChannel, avatarPhysicalFile) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const extension = path_1.extname(avatarPhysicalFile.filename);
        const avatarName = uuid_1.v4() + extension;
        const destination = path_1.join(config_1.CONFIG.STORAGE.AVATARS_DIR, avatarName);
        yield image_utils_1.processImage(avatarPhysicalFile.path, destination, constants_1.AVATARS_SIZE);
        return database_utils_1.retryTransactionWrapper(() => {
            return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const avatarInfo = {
                    name: avatarName,
                    fileUrl: null,
                    onDisk: true
                };
                const updatedActor = yield actor_1.updateActorAvatarInstance(accountOrChannel.Actor, avatarInfo, t);
                yield updatedActor.save({ transaction: t });
                yield send_1.sendUpdateActor(accountOrChannel, t);
                return updatedActor.Avatar;
            }));
        });
    });
}
exports.updateLocalActorAvatarFile = updateLocalActorAvatarFile;
function deleteLocalActorAvatarFile(accountOrChannel) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return database_utils_1.retryTransactionWrapper(() => {
            return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const updatedActor = yield actor_1.deleteActorAvatarInstance(accountOrChannel.Actor, t);
                yield updatedActor.save({ transaction: t });
                yield send_1.sendUpdateActor(accountOrChannel, t);
                return updatedActor.Avatar;
            }));
        });
    });
}
exports.deleteLocalActorAvatarFile = deleteLocalActorAvatarFile;
const downloadImageQueue = async_1.queue((task, cb) => {
    requests_1.downloadImage(task.fileUrl, config_1.CONFIG.STORAGE.AVATARS_DIR, task.filename, constants_1.AVATARS_SIZE)
        .then(() => cb())
        .catch(err => cb(err));
}, constants_1.QUEUE_CONCURRENCY.AVATAR_PROCESS_IMAGE);
function pushAvatarProcessInQueue(task) {
    return new Promise((res, rej) => {
        downloadImageQueue.push(task, err => {
            if (err)
                return rej(err);
            return res();
        });
    });
}
exports.pushAvatarProcessInQueue = pushAvatarProcessInQueue;
const avatarPathUnsafeCache = new LRUCache({ max: constants_1.LRU_CACHE.AVATAR_STATIC.MAX_SIZE });
exports.avatarPathUnsafeCache = avatarPathUnsafeCache;
