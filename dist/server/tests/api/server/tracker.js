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
const magnetUtil = require("magnet-uri");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const WebTorrent = require("webtorrent");
describe('Test tracker', function () {
    let server;
    let badMagnet;
    let goodMagnet;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield index_1.setAccessTokensToServers([server]);
            {
                const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, {});
                const videoUUID = res.body.video.uuid;
                const resGet = yield extra_utils_1.getVideo(server.url, videoUUID);
                const video = resGet.body;
                goodMagnet = video.files[0].magnetUri;
                const parsed = magnetUtil.decode(goodMagnet);
                parsed.infoHash = '010597bb88b1968a5693a4fa8267c592ca65f2e9';
                badMagnet = magnetUtil.encode(parsed);
            }
        });
    });
    it('Should return an error when adding an incorrect infohash', function (done) {
        this.timeout(10000);
        const webtorrent = new WebTorrent();
        const torrent = webtorrent.add(badMagnet);
        torrent.on('error', done);
        torrent.on('warning', warn => {
            const message = typeof warn === 'string' ? warn : warn.message;
            if (message.includes('Unknown infoHash '))
                return done();
        });
        torrent.on('done', () => done(new Error('No error on infohash')));
    });
    it('Should succeed with the correct infohash', function (done) {
        this.timeout(10000);
        const webtorrent = new WebTorrent();
        const torrent = webtorrent.add(goodMagnet);
        torrent.on('error', done);
        torrent.on('warning', warn => {
            const message = typeof warn === 'string' ? warn : warn.message;
            if (message.includes('Unknown infoHash '))
                return done(new Error('Error on infohash'));
        });
        torrent.on('done', done);
    });
    it('Should disable the tracker', function (done) {
        this.timeout(20000);
        const errCb = () => done(new Error('Tracker is enabled'));
        extra_utils_1.killallServers([server]);
        extra_utils_1.reRunServer(server, { tracker: { enabled: false } })
            .then(() => {
            const webtorrent = new WebTorrent();
            const torrent = webtorrent.add(goodMagnet);
            torrent.on('error', done);
            torrent.on('warning', warn => {
                const message = typeof warn === 'string' ? warn : warn.message;
                if (message.includes('disabled ')) {
                    torrent.off('done', errCb);
                    return done();
                }
            });
            torrent.on('done', errCb);
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
