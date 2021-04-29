"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const program = require("commander");
const video_1 = require("../server/models/video/video");
const database_1 = require("../server/initializers/database");
const job_queue_1 = require("../server/lib/job-queue");
const ffprobe_utils_1 = require("@server/helpers/ffprobe-utils");
const config_1 = require("@server/initializers/config");
const misc_1 = require("@server/helpers/custom-validators/misc");
program
    .option('-v, --video [videoUUID]', 'Video UUID')
    .option('-r, --resolution [resolution]', 'Video resolution (integer)')
    .option('--generate-hls', 'Generate HLS playlist')
    .parse(process.argv);
const options = program.opts();
if (options.video === undefined) {
    console.error('All parameters are mandatory.');
    process.exit(-1);
}
if (options.resolution !== undefined && Number.isNaN(+options.resolution)) {
    console.error('The resolution must be an integer (example: 1080).');
    process.exit(-1);
}
run()
    .then(() => process.exit(0))
    .catch(err => {
    console.error(err);
    process.exit(-1);
});
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield database_1.initDatabaseModels(true);
        if (misc_1.isUUIDValid(options.video) === false) {
            console.error('%s is not a valid video UUID.', options.video);
            return;
        }
        const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(options.video);
        if (!video)
            throw new Error('Video not found.');
        const dataInput = [];
        const { videoFileResolution } = yield video.getMaxQualityResolution();
        if (options.generateHls || config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED === false) {
            const resolutionsEnabled = options.resolution
                ? [options.resolution]
                : ffprobe_utils_1.computeResolutionsToTranscode(videoFileResolution, 'vod').concat([videoFileResolution]);
            for (const resolution of resolutionsEnabled) {
                dataInput.push({
                    type: 'new-resolution-to-hls',
                    videoUUID: video.uuid,
                    resolution,
                    isPortraitMode: false,
                    copyCodecs: false,
                    isMaxQuality: false
                });
            }
        }
        else {
            if (options.resolution !== undefined) {
                dataInput.push({
                    type: 'new-resolution-to-webtorrent',
                    videoUUID: video.uuid,
                    isNewVideo: false,
                    resolution: options.resolution
                });
            }
            else {
                if (video.VideoFiles.length === 0) {
                    console.error('Cannot regenerate webtorrent files with a HLS only video.');
                    return;
                }
                dataInput.push({
                    type: 'optimize-to-webtorrent',
                    videoUUID: video.uuid,
                    isNewVideo: false
                });
            }
        }
        yield job_queue_1.JobQueue.Instance.init();
        for (const d of dataInput) {
            yield job_queue_1.JobQueue.Instance.createJobWithPromise({ type: 'video-transcoding', payload: d });
            console.log('Transcoding job for video %s created.', video.uuid);
        }
    });
}
