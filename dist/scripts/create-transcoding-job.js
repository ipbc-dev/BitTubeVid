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
const program = require("commander");
const video_1 = require("../server/models/video/video");
const initializers_1 = require("../server/initializers");
const job_queue_1 = require("../server/lib/job-queue");
const ffmpeg_utils_1 = require("@server/helpers/ffmpeg-utils");
program
    .option('-v, --video [videoUUID]', 'Video UUID')
    .option('-r, --resolution [resolution]', 'Video resolution (integer)')
    .option('--generate-hls', 'Generate HLS playlist')
    .parse(process.argv);
if (program['video'] === undefined) {
    console.error('All parameters are mandatory.');
    process.exit(-1);
}
if (program.resolution !== undefined && Number.isNaN(+program.resolution)) {
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
    return __awaiter(this, void 0, void 0, function* () {
        yield initializers_1.initDatabaseModels(true);
        const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(program['video']);
        if (!video)
            throw new Error('Video not found.');
        const dataInput = [];
        const { videoFileResolution } = yield video.getMaxQualityResolution();
        if (program.generateHls) {
            const resolutionsEnabled = program.resolution
                ? [program.resolution]
                : ffmpeg_utils_1.computeResolutionsToTranscode(videoFileResolution).concat([videoFileResolution]);
            for (const resolution of resolutionsEnabled) {
                dataInput.push({
                    type: 'hls',
                    videoUUID: video.uuid,
                    resolution,
                    isPortraitMode: false,
                    copyCodecs: false
                });
            }
        }
        else if (program.resolution !== undefined) {
            dataInput.push({
                type: 'new-resolution',
                videoUUID: video.uuid,
                isNewVideo: false,
                resolution: program.resolution
            });
        }
        else {
            dataInput.push({
                type: 'optimize',
                videoUUID: video.uuid,
                isNewVideo: false
            });
        }
        yield job_queue_1.JobQueue.Instance.init();
        for (const d of dataInput) {
            yield job_queue_1.JobQueue.Instance.createJob({ type: 'video-transcoding', payload: d });
            console.log('Transcoding job for video %s created.', video.uuid);
        }
    });
}
