"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const register_ts_paths_1 = require("../helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const program = require("commander");
const path_1 = require("path");
const child_process_1 = require("child_process");
program
    .name('watch')
    .arguments('<url>')
    .addOption(new program.Option('-g, --gui <player>', 'player type')
    .default('vlc')
    .choices(['airplay', 'stdout', 'chromecast', 'mpv', 'vlc', 'mplayer', 'xbmc']))
    .option('-r, --resolution <res>', 'video resolution', '480')
    .addHelpText('after', '\n\n  Examples:\n\n' +
    '    $ peertube watch -g mpv https://peertube.cpy.re/videos/watch/e8a1af4e-414a-4d58-bfe6-2146eed06d10\n' +
    '    $ peertube watch --gui stdout https://peertube.cpy.re/videos/watch/e8a1af4e-414a-4d58-bfe6-2146eed06d10\n' +
    '    $ peertube watch https://peertube.cpy.re/videos/watch/e8a1af4e-414a-4d58-bfe6-2146eed06d10\n')
    .action((url, options) => run(url, options))
    .parse(process.argv);
function run(url, options) {
    if (!url) {
        console.error('<url> positional argument is required.');
        process.exit(-1);
    }
    const cmd = 'node ' + path_1.join(__dirname, 'node_modules', 'webtorrent-hybrid', 'bin', 'cmd.js');
    const args = ` --${options.gui} ` +
        url.replace('videos/watch', 'download/torrents') +
        `-${options.resolution}.torrent`;
    try {
        child_process_1.execSync(cmd + args);
    }
    catch (err) {
        console.error('Cannto exec command.', err);
        process.exit(-1);
    }
}
