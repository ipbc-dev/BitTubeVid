"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoWithFramerate = exports.generateHighBitrateVideo = exports.root = exports.buildAbsoluteFixturePath = exports.isGithubCI = exports.testImage = exports.immutableAssign = exports.getFileSize = exports.webtorrentAdd = exports.buildServerDirectory = exports.areHttpImportTestsDisabled = exports.wait = exports.dateIsValid = void 0;
const tslib_1 = require("tslib");
const chai = require("chai");
const ffmpeg = require("fluent-ffmpeg");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const request = require("supertest");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
let webtorrent;
function immutableAssign(target, source) {
    return Object.assign({}, target, source);
}
exports.immutableAssign = immutableAssign;
function dateIsValid(dateString, interval = 300000) {
    const dateToCheck = new Date(dateString);
    const now = new Date();
    return Math.abs(now.getTime() - dateToCheck.getTime()) <= interval;
}
exports.dateIsValid = dateIsValid;
function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
exports.wait = wait;
function webtorrentAdd(torrent, refreshWebTorrent = false) {
    const WebTorrent = require('webtorrent');
    if (!webtorrent)
        webtorrent = new WebTorrent();
    if (refreshWebTorrent === true)
        webtorrent = new WebTorrent();
    return new Promise(res => webtorrent.add(torrent, res));
}
exports.webtorrentAdd = webtorrentAdd;
function root() {
    let root = path_1.join(__dirname, '..', '..', '..');
    if (path_1.basename(root) === 'dist')
        root = path_1.resolve(root, '..');
    return root;
}
exports.root = root;
function buildServerDirectory(server, directory) {
    return path_1.join(root(), 'test' + server.internalServerNumber, directory);
}
exports.buildServerDirectory = buildServerDirectory;
function testImage(url, imageName, imagePath, extension = '.jpg') {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield request(url)
            .get(imagePath)
            .expect(http_error_codes_1.HttpStatusCode.OK_200);
        const body = res.body;
        const data = yield fs_extra_1.readFile(path_1.join(root(), 'server', 'tests', 'fixtures', imageName + extension));
        const minLength = body.length - ((30 * body.length) / 100);
        const maxLength = body.length + ((30 * body.length) / 100);
        expect(data.length).to.be.above(minLength, "the generated image is way smaller than the recorded fixture");
        expect(data.length).to.be.below(maxLength, "the generated image is way larger than the recorded fixture");
    });
}
exports.testImage = testImage;
function isGithubCI() {
    return !!process.env.GITHUB_WORKSPACE;
}
exports.isGithubCI = isGithubCI;
function buildAbsoluteFixturePath(path, customCIPath = false) {
    if (path_1.isAbsolute(path))
        return path;
    if (customCIPath && process.env.GITHUB_WORKSPACE) {
        return path_1.join(process.env.GITHUB_WORKSPACE, 'fixtures', path);
    }
    return path_1.join(root(), 'server', 'tests', 'fixtures', path);
}
exports.buildAbsoluteFixturePath = buildAbsoluteFixturePath;
function areHttpImportTestsDisabled() {
    const disabled = process.env.DISABLE_HTTP_IMPORT_TESTS === 'true';
    if (disabled)
        console.log('Import tests are disabled');
    return disabled;
}
exports.areHttpImportTestsDisabled = areHttpImportTestsDisabled;
function generateHighBitrateVideo() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const tempFixturePath = buildAbsoluteFixturePath('video_high_bitrate_1080p.mp4', true);
        yield fs_extra_1.ensureDir(path_1.dirname(tempFixturePath));
        const exists = yield fs_extra_1.pathExists(tempFixturePath);
        if (!exists) {
            console.log('Generating high bitrate video.');
            return new Promise((res, rej) => {
                ffmpeg()
                    .outputOptions(['-f rawvideo', '-video_size 1920x1080', '-i /dev/urandom'])
                    .outputOptions(['-ac 2', '-f s16le', '-i /dev/urandom', '-t 10'])
                    .outputOptions(['-maxrate 10M', '-bufsize 10M'])
                    .output(tempFixturePath)
                    .on('error', rej)
                    .on('end', () => res(tempFixturePath))
                    .run();
            });
        }
        return tempFixturePath;
    });
}
exports.generateHighBitrateVideo = generateHighBitrateVideo;
function generateVideoWithFramerate(fps = 60) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const tempFixturePath = buildAbsoluteFixturePath(`video_${fps}fps.mp4`, true);
        yield fs_extra_1.ensureDir(path_1.dirname(tempFixturePath));
        const exists = yield fs_extra_1.pathExists(tempFixturePath);
        if (!exists) {
            console.log('Generating video with framerate %d.', fps);
            return new Promise((res, rej) => {
                ffmpeg()
                    .outputOptions(['-f rawvideo', '-video_size 1280x720', '-i /dev/urandom'])
                    .outputOptions(['-ac 2', '-f s16le', '-i /dev/urandom', '-t 10'])
                    .outputOptions([`-r ${fps}`])
                    .output(tempFixturePath)
                    .on('error', rej)
                    .on('end', () => res(tempFixturePath))
                    .run();
            });
        }
        return tempFixturePath;
    });
}
exports.generateVideoWithFramerate = generateVideoWithFramerate;
function getFileSize(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const stats = yield fs_extra_1.stat(path);
        return stats.size;
    });
}
exports.getFileSize = getFileSize;
