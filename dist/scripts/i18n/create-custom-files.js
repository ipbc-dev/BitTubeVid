"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const register_ts_paths_1 = require("../../server/helpers/register-ts-paths");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const constants_1 = require("../../server/initializers/constants");
const lodash_1 = require("lodash");
register_ts_paths_1.registerTSPaths();
const videojs = require(path_1.join(__dirname, '../../../client/src/locale/videojs.en-US.json'));
const playerKeys = {
    'Quality': 'Quality',
    'Auto': 'Auto',
    'Speed': 'Speed',
    'Subtitles/CC': 'Subtitles/CC',
    'peers': 'peers',
    'peer': 'peer',
    'Go to the video page': 'Go to the video page',
    'Settings': 'Settings',
    'Uses P2P, others may know you are watching this video.': 'Uses P2P, others may know you are watching this video.',
    'Copy the video URL': 'Copy the video URL',
    'Copy the video URL at the current time': 'Copy the video URL at the current time',
    'Copy embed code': 'Copy embed code',
    'Copy magnet URI': 'Copy magnet URI',
    'Total downloaded: ': 'Total downloaded: ',
    'Total uploaded: ': 'Total uploaded: '
};
Object.assign(playerKeys, videojs);
const serverKeys = {};
lodash_1.values(constants_1.VIDEO_CATEGORIES)
    .concat(lodash_1.values(constants_1.VIDEO_LICENCES))
    .concat(lodash_1.values(constants_1.VIDEO_PRIVACIES))
    .concat(lodash_1.values(constants_1.VIDEO_STATES))
    .concat(lodash_1.values(constants_1.VIDEO_IMPORT_STATES))
    .concat(lodash_1.values(constants_1.VIDEO_PLAYLIST_PRIVACIES))
    .concat(lodash_1.values(constants_1.VIDEO_PLAYLIST_TYPES))
    .concat([
    'This video does not exist.',
    'We cannot fetch the video. Please try again later.',
    'Sorry',
    'This video is not available because the remote instance is not responding.'
])
    .forEach(v => serverKeys[v] = v);
Object.assign(serverKeys, {
    'Misc': 'Misc',
    'Unknown': 'Unknown'
});
const languageKeys = {};
const languages = constants_1.buildLanguages();
Object.keys(languages).forEach(k => languageKeys[languages[k]] = languages[k]);
Object.assign(serverKeys, languageKeys);
Promise.all([
    fs_extra_1.writeJSON(path_1.join(__dirname, '../../../client/src/locale/player.en-US.json'), playerKeys),
    fs_extra_1.writeJSON(path_1.join(__dirname, '../../../client/src/locale/server.en-US.json'), serverKeys)
]).catch(err => {
    console.error(err);
    process.exit(-1);
});
