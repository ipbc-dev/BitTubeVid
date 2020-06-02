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
const cli_1 = require("./cli");
const redundancy_1 = require("@shared/extra-utils/server/redundancy");
const validator_1 = require("validator");
const CliTable3 = require("cli-table3");
const url_1 = require("url");
const lodash_1 = require("lodash");
const bytes = require("bytes");
program
    .name('plugins')
    .usage('[command] [options]');
program
    .command('list-remote-redundancies')
    .description('List remote redundancies on your videos')
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .action(() => listRedundanciesCLI('my-videos'));
program
    .command('list-my-redundancies')
    .description('List your redundancies of remote videos')
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .action(() => listRedundanciesCLI('remote-videos'));
program
    .command('add')
    .description('Duplicate a video in your redundancy system')
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .option('-v, --video <videoId>', 'Video id to duplicate')
    .action((options) => addRedundancyCLI(options));
program
    .command('remove')
    .description('Remove a video from your redundancies')
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .option('-v, --video <videoId>', 'Video id to remove from redundancies')
    .action((options) => removeRedundancyCLI(options));
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
program.parse(process.argv);
function listRedundanciesCLI(target) {
    return __awaiter(this, void 0, void 0, function* () {
        const { url, username, password } = yield cli_1.getServerCredentials(program);
        const accessToken = yield cli_1.getAdminTokenOrDie(url, username, password);
        const redundancies = yield listVideoRedundanciesData(url, accessToken, target);
        const table = new CliTable3({
            head: ['video id', 'video name', 'video url', 'files', 'playlists', 'by instances', 'total size']
        });
        for (const redundancy of redundancies) {
            const webtorrentFiles = redundancy.redundancies.files;
            const streamingPlaylists = redundancy.redundancies.streamingPlaylists;
            let totalSize = '';
            if (target === 'remote-videos') {
                const tmp = webtorrentFiles.concat(streamingPlaylists)
                    .reduce((a, b) => a + b.size, 0);
                totalSize = bytes(tmp);
            }
            const instances = lodash_1.uniq(webtorrentFiles.concat(streamingPlaylists)
                .map(r => r.fileUrl)
                .map(u => new url_1.URL(u).host));
            table.push([
                redundancy.id.toString(),
                redundancy.name,
                redundancy.url,
                webtorrentFiles.length,
                streamingPlaylists.length,
                instances.join('\n'),
                totalSize
            ]);
        }
        console.log(table.toString());
        process.exit(0);
    });
}
function addRedundancyCLI(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { url, username, password } = yield cli_1.getServerCredentials(program);
        const accessToken = yield cli_1.getAdminTokenOrDie(url, username, password);
        if (!options['video'] || validator_1.default.isInt('' + options['video']) === false) {
            console.error('You need to specify the video id to duplicate and it should be a number.\n');
            program.outputHelp();
            process.exit(-1);
        }
        try {
            yield redundancy_1.addVideoRedundancy({
                url,
                accessToken,
                videoId: options['video']
            });
            console.log('Video will be duplicated by your instance!');
            process.exit(0);
        }
        catch (err) {
            if (err.message.includes(409)) {
                console.error('This video is already duplicated by your instance.');
            }
            else if (err.message.includes(404)) {
                console.error('This video id does not exist.');
            }
            else {
                console.error(err);
            }
            process.exit(-1);
        }
    });
}
function removeRedundancyCLI(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { url, username, password } = yield cli_1.getServerCredentials(program);
        const accessToken = yield cli_1.getAdminTokenOrDie(url, username, password);
        if (!options['video'] || validator_1.default.isInt('' + options['video']) === false) {
            console.error('You need to specify the video id to remove from your redundancies.\n');
            program.outputHelp();
            process.exit(-1);
        }
        const videoId = parseInt(options['video'] + '', 10);
        let redundancies = yield listVideoRedundanciesData(url, accessToken, 'my-videos');
        let videoRedundancy = redundancies.find(r => videoId === r.id);
        if (!videoRedundancy) {
            redundancies = yield listVideoRedundanciesData(url, accessToken, 'remote-videos');
            videoRedundancy = redundancies.find(r => videoId === r.id);
        }
        if (!videoRedundancy) {
            console.error('Video redundancy not found.');
            process.exit(-1);
        }
        try {
            const ids = videoRedundancy.redundancies.files
                .concat(videoRedundancy.redundancies.streamingPlaylists)
                .map(r => r.id);
            for (const id of ids) {
                yield redundancy_1.removeVideoRedundancy({
                    url,
                    accessToken,
                    redundancyId: id
                });
            }
            console.log('Video redundancy removed!');
            process.exit(0);
        }
        catch (err) {
            console.error(err);
            process.exit(-1);
        }
    });
}
function listVideoRedundanciesData(url, accessToken, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield redundancy_1.listVideoRedundancies({
            url,
            accessToken,
            start: 0,
            count: 100,
            sort: 'name',
            target
        });
        return res.body.data;
    });
}
