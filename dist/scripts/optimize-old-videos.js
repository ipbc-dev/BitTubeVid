"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const constants_1 = require("../server/initializers/constants");
const ffprobe_utils_1 = require("../server/helpers/ffprobe-utils");
const videos_1 = require("../shared/models/videos");
const video_1 = require("../server/models/video/video");
const video_transcoding_1 = require("../server/lib/video-transcoding");
const database_1 = require("../server/initializers/database");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const webtorrent_1 = require("@server/helpers/webtorrent");
const video_paths_1 = require("@server/lib/video-paths");
run()
    .then(() => process.exit(0))
    .catch(err => {
    console.error(err);
    process.exit(-1);
});
let currentVideoId = null;
let currentFile = null;
process.on('SIGINT', function () {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log('Cleaning up temp files');
        yield fs_extra_1.remove(`${currentFile}_backup`);
        yield fs_extra_1.remove(`${path_1.dirname(currentFile)}/${currentVideoId}-transcoded.mp4`);
        process.exit(0);
    });
});
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield database_1.initDatabaseModels(true);
        const localVideos = yield video_1.VideoModel.listLocal();
        for (const localVideo of localVideos) {
            const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(localVideo.id);
            currentVideoId = video.id;
            for (const file of video.VideoFiles) {
                currentFile = video_paths_1.getVideoFilePath(video, file);
                const [videoBitrate, fps, resolution] = yield Promise.all([
                    ffprobe_utils_1.getVideoFileBitrate(currentFile),
                    ffprobe_utils_1.getVideoFileFPS(currentFile),
                    ffprobe_utils_1.getVideoFileResolution(currentFile)
                ]);
                const maxBitrate = videos_1.getMaxBitrate(resolution.videoFileResolution, fps, constants_1.VIDEO_TRANSCODING_FPS);
                const isMaxBitrateExceeded = videoBitrate > maxBitrate;
                if (isMaxBitrateExceeded) {
                    console.log('Optimizing video file %s with bitrate %s kbps (max: %s kbps)', path_1.basename(currentFile), videoBitrate / 1000, maxBitrate / 1000);
                    const backupFile = `${currentFile}_backup`;
                    yield fs_extra_1.copy(currentFile, backupFile);
                    yield video_transcoding_1.optimizeOriginalVideofile(video, file);
                    const originalDuration = yield ffprobe_utils_1.getDurationFromVideoFile(backupFile);
                    const newDuration = yield ffprobe_utils_1.getDurationFromVideoFile(currentFile);
                    if (originalDuration === newDuration) {
                        console.log('Finished optimizing %s', path_1.basename(currentFile));
                        yield fs_extra_1.remove(backupFile);
                        continue;
                    }
                    console.log('Failed to optimize %s, restoring original', path_1.basename(currentFile));
                    yield fs_extra_1.move(backupFile, currentFile, { overwrite: true });
                    yield webtorrent_1.createTorrentAndSetInfoHash(video, file);
                    yield file.save();
                }
            }
        }
        console.log('Finished optimizing videos');
    });
}
