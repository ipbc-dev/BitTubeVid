"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const program = require("commander");
const ffmpeg = require("fluent-ffmpeg");
const ffmpeg_utils_1 = require("@server/helpers/ffmpeg-utils");
const process_1 = require("process");
const video_transcoding_profiles_1 = require("@server/lib/video-transcoding-profiles");
program
    .arguments('<path>')
    .requiredOption('-r, --resolution [resolution]', 'video resolution')
    .action((path, cmd) => {
    if (cmd.resolution !== undefined && Number.isNaN(+cmd.resolution)) {
        console.error('The resolution must be an integer (example: 1080).');
        process.exit(-1);
    }
    run(path, cmd)
        .then(() => process.exit(0))
        .catch(err => {
        console.error(err);
        process.exit(-1);
    });
})
    .parse(process.argv);
function run(path, cmd) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = {
            type: 'video',
            inputPath: path,
            outputPath: '/dev/null',
            availableEncoders: video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.getAvailableEncoders(),
            profile: 'default',
            resolution: +cmd.resolution,
            isPortraitMode: false
        };
        let command = ffmpeg(options.inputPath)
            .output(options.outputPath);
        command = yield ffmpeg_utils_1.buildx264VODCommand(command, options);
        command.on('start', (cmdline) => {
            console.log(cmdline);
            process_1.exit();
        });
        yield ffmpeg_utils_1.runCommand({ command });
    });
}
