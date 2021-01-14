"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const program = require("commander");
const extra_utils_1 = require("../../shared/extra-utils");
register_ts_paths_1.registerTSPaths();
const command = program
    .name('test')
    .option('-t, --type <type>', 'live-muxing|live-transcoding')
    .parse(process.argv);
run()
    .catch(err => {
    console.error(err);
    process.exit(-1);
});
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const commandType = command['type'];
        if (!commandType) {
            console.error('Miss command type');
            process.exit(-1);
        }
        console.log('Starting server.');
        const server = yield extra_utils_1.flushAndRunServer(1, {}, [], { hideLogs: false, execArgv: ['--inspect'] });
        const cleanup = () => {
            console.log('Killing server');
            extra_utils_1.killallServers([server]);
        };
        process.on('exit', cleanup);
        process.on('SIGINT', cleanup);
        yield extra_utils_1.setAccessTokensToServers([server]);
        yield extra_utils_1.setDefaultVideoChannel([server]);
        yield buildConfig(server, commandType);
        const attributes = {
            name: 'live',
            saveReplay: true,
            channelId: server.videoChannel.id,
            privacy: 1
        };
        console.log('Creating live.');
        const res = yield extra_utils_1.createLive(server.url, server.accessToken, attributes);
        const liveVideoUUID = res.body.video.uuid;
        const resLive = yield extra_utils_1.getLive(server.url, server.accessToken, liveVideoUUID);
        const live = resLive.body;
        console.log('Sending RTMP stream.');
        const ffmpegCommand = extra_utils_1.sendRTMPStream(live.rtmpUrl, live.streamKey);
        ffmpegCommand.on('error', err => {
            console.error(err);
            process.exit(-1);
        });
        ffmpegCommand.on('end', () => {
            console.log('ffmpeg ended');
            process.exit(0);
        });
    });
}
function buildConfig(server, commandType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
            instance: {
                customizations: {
                    javascript: '',
                    css: ''
                }
            },
            live: {
                enabled: true,
                allowReplay: true,
                transcoding: {
                    enabled: commandType === 'live-transcoding'
                }
            }
        });
    });
}
