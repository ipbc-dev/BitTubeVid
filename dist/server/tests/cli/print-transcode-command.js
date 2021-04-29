"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../shared/extra-utils");
const videos_1 = require("../../../shared/models/videos");
const constants_1 = require("../../initializers/constants");
const ffprobe_utils_1 = require("@server/helpers/ffprobe-utils");
const expect = chai.expect;
describe('Test create transcoding jobs', function () {
    it('Should print the correct command for each resolution', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const fixturePath = 'server/tests/fixtures/video_short.webm';
            const fps = yield ffprobe_utils_1.getVideoFileFPS(fixturePath);
            const bitrate = yield ffprobe_utils_1.getVideoFileBitrate(fixturePath);
            for (const resolution of [
                720,
                1080
            ]) {
                const command = yield extra_utils_1.execCLI(`npm run print-transcode-command -- ${fixturePath} -r ${resolution}`);
                const targetBitrate = Math.min(videos_1.getTargetBitrate(resolution, fps, constants_1.VIDEO_TRANSCODING_FPS), bitrate);
                expect(command).to.includes(`-y -acodec aac -vcodec libx264 -filter:v scale=w=trunc(oh*a/2)*2:h=${resolution}`);
                expect(command).to.includes('-f mp4');
                expect(command).to.includes('-movflags faststart');
                expect(command).to.includes('-b:a 256k');
                expect(command).to.includes('-r 25');
                expect(command).to.includes('-level:v 3.1');
                expect(command).to.includes('-g:v 50');
                expect(command).to.includes(`-maxrate ${targetBitrate}`);
                expect(command).to.includes(`-bufsize ${targetBitrate * 2}`);
            }
        });
    });
});
