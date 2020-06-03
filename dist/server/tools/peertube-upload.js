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
cli_1.getServerCredentials(command)
    .then(({ url, username, password }) => {
    if (!program['videoName'] || !program['file']) {
        if (!program['videoName'])
            console.error('--video-name is required.');
        if (!program['file'])
            console.error('--file is required.');
        process.exit(-1);
    }
    if (path_1.isAbsolute(program['file']) === false) {
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
    return __awaiter(this, void 0, void 0, function* () {
        const accessToken = yield extra_utils_1.getAccessToken(url, username, password);
        yield fs_extra_1.access(program['file'], fs_extra_1.constants.F_OK);
        console.log('Uploading %s video...', program['videoName']);
        const videoAttributes = yield cli_1.buildVideoAttributesFromCommander(url, program);
        Object.assign(videoAttributes, {
            fixture: program['file'],
            thumbnailfile: program['thumbnail'],
            previewfile: program['preview']
        });
        try {
            yield extra_utils_2.uploadVideo(url, accessToken, videoAttributes);
            console.log(`Video ${program['videoName']} uploaded.`);
            process.exit(0);
        }
        catch (err) {
            console.error(require('util').inspect(err));
            process.exit(-1);
        }
    });
}
