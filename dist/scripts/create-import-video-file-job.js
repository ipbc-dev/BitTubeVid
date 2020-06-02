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
const path_1 = require("path");
const video_1 = require("../server/models/video/video");
const database_1 = require("../server/initializers/database");
const job_queue_1 = require("../server/lib/job-queue");
program
    .option('-v, --video [videoUUID]', 'Video UUID')
    .option('-i, --import [videoFile]', 'Video file')
    .description('Import a video file to replace an already uploaded file or to add a new resolution')
    .parse(process.argv);
if (program['video'] === undefined || program['import'] === undefined) {
    console.error('All parameters are mandatory.');
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
        yield database_1.initDatabaseModels(true);
        const video = yield video_1.VideoModel.loadByUUID(program['video']);
        if (!video)
            throw new Error('Video not found.');
        if (video.isOwned() === false)
            throw new Error('Cannot import files of a non owned video.');
        const dataInput = {
            videoUUID: video.uuid,
            filePath: path_1.resolve(program['import'])
        };
        yield job_queue_1.JobQueue.Instance.init();
        yield job_queue_1.JobQueue.Instance.createJobWithPromise({ type: 'video-file-import', payload: dataInput });
        console.log('Import job for video %s created.', video.uuid);
    });
}
