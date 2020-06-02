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
const register_ts_paths_1 = require("../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const prompt = require("prompt");
const path_1 = require("path");
const config_1 = require("../server/initializers/config");
const video_1 = require("../server/models/video/video");
const database_1 = require("../server/initializers/database");
const fs_extra_1 = require("fs-extra");
const video_redundancy_1 = require("../server/models/redundancy/video-redundancy");
const Bluebird = require("bluebird");
const utils_1 = require("../server/helpers/utils");
const thumbnail_1 = require("../server/models/video/thumbnail");
const avatar_1 = require("../server/models/avatar/avatar");
const lodash_1 = require("lodash");
run()
    .then(() => process.exit(0))
    .catch(err => {
    console.error(err);
    process.exit(-1);
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const dirs = lodash_1.values(config_1.CONFIG.STORAGE);
        if (lodash_1.uniq(dirs).length !== dirs.length) {
            console.error('Cannot prune storage because you put multiple storage keys in the same directory.');
            process.exit(0);
        }
        yield database_1.initDatabaseModels(true);
        let toDelete = [];
        toDelete = toDelete.concat(yield pruneDirectory(config_1.CONFIG.STORAGE.VIDEOS_DIR, doesVideoExist(true)), yield pruneDirectory(config_1.CONFIG.STORAGE.TORRENTS_DIR, doesVideoExist(true)), yield pruneDirectory(config_1.CONFIG.STORAGE.REDUNDANCY_DIR, doesRedundancyExist), yield pruneDirectory(config_1.CONFIG.STORAGE.PREVIEWS_DIR, doesThumbnailExist(true)), yield pruneDirectory(config_1.CONFIG.STORAGE.THUMBNAILS_DIR, doesThumbnailExist(false)), yield pruneDirectory(config_1.CONFIG.STORAGE.AVATARS_DIR, doesAvatarExist));
        const tmpFiles = yield fs_extra_1.readdir(config_1.CONFIG.STORAGE.TMP_DIR);
        toDelete = toDelete.concat(tmpFiles.map(t => path_1.join(config_1.CONFIG.STORAGE.TMP_DIR, t)));
        if (toDelete.length === 0) {
            console.log('No files to delete.');
            return;
        }
        console.log('Will delete %d files:\n\n%s\n\n', toDelete.length, toDelete.join('\n'));
        const res = yield askConfirmation();
        if (res === true) {
            console.log('Processing delete...\n');
            for (const path of toDelete) {
                yield fs_extra_1.remove(path);
            }
            console.log('Done!');
        }
        else {
            console.log('Exiting without deleting files.');
        }
    });
}
function pruneDirectory(directory, existFun) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield fs_extra_1.readdir(directory);
        const toDelete = [];
        yield Bluebird.map(files, (file) => __awaiter(this, void 0, void 0, function* () {
            if ((yield existFun(file)) !== true) {
                toDelete.push(path_1.join(directory, file));
            }
        }), { concurrency: 20 });
        return toDelete;
    });
}
function doesVideoExist(keepOnlyOwned) {
    return (file) => __awaiter(this, void 0, void 0, function* () {
        const uuid = utils_1.getUUIDFromFilename(file);
        const video = yield video_1.VideoModel.loadByUUID(uuid);
        return video && (keepOnlyOwned === false || video.isOwned());
    });
}
function doesThumbnailExist(keepOnlyOwned) {
    return (file) => __awaiter(this, void 0, void 0, function* () {
        const thumbnail = yield thumbnail_1.ThumbnailModel.loadByName(file);
        if (!thumbnail)
            return false;
        if (keepOnlyOwned) {
            const video = yield video_1.VideoModel.load(thumbnail.videoId);
            if (video.isOwned() === false)
                return false;
        }
        return true;
    });
}
function doesAvatarExist(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const avatar = yield avatar_1.AvatarModel.loadByName(file);
        return !!avatar;
    });
}
function doesRedundancyExist(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const uuid = utils_1.getUUIDFromFilename(file);
        const video = yield video_1.VideoModel.loadWithFiles(uuid);
        if (!video)
            return false;
        const isPlaylist = file.includes('.') === false;
        if (isPlaylist) {
            const p = video.getHLSPlaylist();
            if (!p)
                return false;
            const redundancy = yield video_redundancy_1.VideoRedundancyModel.loadLocalByStreamingPlaylistId(p.id);
            return !!redundancy;
        }
        const resolution = parseInt(file.split('-')[5], 10);
        if (isNaN(resolution)) {
            console.error('Cannot prune %s because we cannot guess guess the resolution.', file);
            return true;
        }
        const videoFile = video.getWebTorrentFile(resolution);
        if (!videoFile) {
            console.error('Cannot find webtorrent file of video %s - %d', video.url, resolution);
            return true;
        }
        const redundancy = yield video_redundancy_1.VideoRedundancyModel.loadLocalByFileId(videoFile.id);
        return !!redundancy;
    });
}
function askConfirmation() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res, rej) => {
            prompt.start();
            const schema = {
                properties: {
                    confirm: {
                        type: 'string',
                        description: 'These following unused files can be deleted, but please check your backups first (bugs happen).' +
                            ' Notice BitTube must have been stopped when your ran this script.' +
                            ' Can we delete these files?',
                        default: 'n',
                        required: true
                    }
                }
            };
            prompt.get(schema, function (err, result) {
                if (err)
                    return rej(err);
                return res(result.confirm && result.confirm.match(/y/) !== null);
            });
        });
    });
}
