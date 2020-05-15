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
const logger_1 = require("./logger");
const utils_1 = require("./utils");
const WebTorrent = require("webtorrent");
const fs_extra_1 = require("fs-extra");
const config_1 = require("../initializers/config");
const path_1 = require("path");
const createTorrent = require("create-torrent");
const core_utils_1 = require("./core-utils");
const video_streaming_playlist_1 = require("@server/typings/models/video/video-streaming-playlist");
const constants_1 = require("@server/initializers/constants");
const parseTorrent = require("parse-torrent");
const magnetUtil = require("magnet-uri");
const misc_1 = require("@server/helpers/custom-validators/misc");
const videos_1 = require("@server/lib/videos");
const video_paths_1 = require("@server/lib/video-paths");
const createTorrentPromise = core_utils_1.promisify2(createTorrent);
exports.createTorrentPromise = createTorrentPromise;
function downloadWebTorrentVideo(target, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = target.magnetUri || target.torrentName;
        let timer;
        const path = utils_1.generateVideoImportTmpPath(id);
        logger_1.logger.info('Importing torrent video %s', id);
        const directoryPath = path_1.join(config_1.CONFIG.STORAGE.TMP_DIR, 'webtorrent');
        yield fs_extra_1.ensureDir(directoryPath);
        return new Promise((res, rej) => {
            const webtorrent = new WebTorrent();
            let file;
            const torrentId = target.magnetUri || path_1.join(config_1.CONFIG.STORAGE.TORRENTS_DIR, target.torrentName);
            const options = { path: directoryPath };
            const torrent = webtorrent.add(torrentId, options, torrent => {
                if (torrent.files.length !== 1) {
                    if (timer)
                        clearTimeout(timer);
                    for (let file of torrent.files) {
                        deleteDownloadedFile({ directoryPath, filepath: file.path });
                    }
                    return safeWebtorrentDestroy(webtorrent, torrentId, undefined, target.torrentName)
                        .then(() => rej(new Error('Cannot import torrent ' + torrentId + ': there are multiple files in it')));
                }
                file = torrent.files[0];
                const writeStream = fs_extra_1.createWriteStream(path);
                writeStream.on('finish', () => {
                    if (timer)
                        clearTimeout(timer);
                    return safeWebtorrentDestroy(webtorrent, torrentId, { directoryPath, filepath: file.path }, target.torrentName)
                        .then(() => res(path));
                });
                file.createReadStream().pipe(writeStream);
            });
            torrent.on('error', err => rej(err));
            timer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                return safeWebtorrentDestroy(webtorrent, torrentId, file ? { directoryPath, filepath: file.path } : undefined, target.torrentName)
                    .then(() => rej(new Error('Webtorrent download timeout.')));
            }), timeout);
        });
    });
}
exports.downloadWebTorrentVideo = downloadWebTorrentVideo;
function createTorrentAndSetInfoHash(videoOrPlaylist, videoFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = videos_1.extractVideo(videoOrPlaylist);
        const { baseUrlHttp } = video.getBaseUrls();
        const options = {
            name: `${video.name} ${videoFile.resolution}p${videoFile.extname}`,
            createdBy: 'PeerTube',
            announceList: [
                [constants_1.WEBSERVER.WS + '://' + constants_1.WEBSERVER.HOSTNAME + ':' + constants_1.WEBSERVER.PORT + '/tracker/socket'],
                [constants_1.WEBSERVER.URL + '/tracker/announce']
            ],
            urlList: [videoOrPlaylist.getVideoFileUrl(videoFile, baseUrlHttp)]
        };
        const torrent = yield createTorrentPromise(video_paths_1.getVideoFilePath(videoOrPlaylist, videoFile), options);
        const filePath = path_1.join(config_1.CONFIG.STORAGE.TORRENTS_DIR, video_paths_1.getTorrentFileName(videoOrPlaylist, videoFile));
        logger_1.logger.info('Creating torrent %s.', filePath);
        yield fs_extra_1.writeFile(filePath, torrent);
        const parsedTorrent = parseTorrent(torrent);
        videoFile.infoHash = parsedTorrent.infoHash;
    });
}
exports.createTorrentAndSetInfoHash = createTorrentAndSetInfoHash;
function generateMagnetUri(videoOrPlaylist, videoFile, baseUrlHttp, baseUrlWs) {
    const video = video_streaming_playlist_1.isStreamingPlaylist(videoOrPlaylist)
        ? videoOrPlaylist.Video
        : videoOrPlaylist;
    const xs = videoOrPlaylist.getTorrentUrl(videoFile, baseUrlHttp);
    const announce = videoOrPlaylist.getTrackerUrls(baseUrlHttp, baseUrlWs);
    let urlList = [videoOrPlaylist.getVideoFileUrl(videoFile, baseUrlHttp)];
    const redundancies = videoFile.RedundancyVideos;
    if (misc_1.isArray(redundancies))
        urlList = urlList.concat(redundancies.map(r => r.fileUrl));
    const magnetHash = {
        xs,
        announce,
        urlList,
        infoHash: videoFile.infoHash,
        name: video.name
    };
    return magnetUtil.encode(magnetHash);
}
exports.generateMagnetUri = generateMagnetUri;
function safeWebtorrentDestroy(webtorrent, torrentId, downloadedFile, torrentName) {
    return new Promise(res => {
        webtorrent.destroy(err => {
            if (torrentName) {
                logger_1.logger.debug('Removing %s torrent after webtorrent download.', torrentId);
                fs_extra_1.remove(torrentId)
                    .catch(err => logger_1.logger.error('Cannot remove torrent %s in webtorrent download.', torrentId, { err }));
            }
            if (downloadedFile)
                deleteDownloadedFile(downloadedFile);
            if (err)
                logger_1.logger.warn('Cannot destroy webtorrent in timeout.', { err });
            return res();
        });
    });
}
function deleteDownloadedFile(downloadedFile) {
    let pathToDelete = path_1.dirname(downloadedFile.filepath);
    if (pathToDelete === '.')
        pathToDelete = downloadedFile.filepath;
    const toRemovePath = path_1.join(downloadedFile.directoryPath, pathToDelete);
    logger_1.logger.debug('Removing %s after webtorrent download.', toRemovePath);
    fs_extra_1.remove(toRemovePath)
        .catch(err => logger_1.logger.error('Cannot remove torrent file %s in webtorrent download.', toRemovePath, { err }));
}
