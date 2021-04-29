"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const program = require("commander");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const extra_utils_1 = require("../../shared/extra-utils");
const extra_utils_2 = require("../../shared/extra-utils/");
const cli_1 = require("./cli");
let command = program
    .name('upload');
command = cli_1.buildCommonVideoOptions(command);
command
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .option('-b, --thumbnail <thumbnailPath>', 'Thumbnail path')
    .option('-v, --preview <previewPath>', 'Preview path')
    .option('-f, --file <file>', 'Video absolute file path')
    .parse(process.argv);
const options = command.opts();
cli_1.getServerCredentials(command)
    .then(({ url, username, password }) => {
    if (!options.videoName || !options.file) {
        if (!options.videoName)
            console.error('--video-name is required.');
        if (!options.file)
            console.error('--file is required.');
        process.exit(-1);
    }
    if (path_1.isAbsolute(options.file) === false) {
        console.error('File path should be absolute.');
        process.exit(-1);
    }
    run(url, username, password).catch(err => {
        console.error(err);
        process.exit(-1);
    });
})
    .catch(err => console.error(err));
function run(url, username, password) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const accessToken = yield extra_utils_1.getAccessToken(url, username, password);
        yield fs_extra_1.access(options.file, fs_extra_1.constants.F_OK);
        console.log('Uploading %s video...', options.videoName);
        const videoAttributes = yield cli_1.buildVideoAttributesFromCommander(url, program);
        Object.assign(videoAttributes, {
            fixture: options.file,
            thumbnailfile: options.thumbnail,
            previewfile: options.preview
        });
        try {
            yield extra_utils_2.uploadVideo(url, accessToken, videoAttributes);
            console.log(`Video ${options.videoName} uploaded.`);
            process.exit(0);
        }
        catch (err) {
            console.error(require('util').inspect(err));
            process.exit(-1);
        }
    });
}
