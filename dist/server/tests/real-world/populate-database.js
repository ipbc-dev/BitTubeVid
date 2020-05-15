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
const extra_utils_1 = require("../../../shared/extra-utils");
const Bluebird = require("bluebird");
start()
    .catch(err => console.error(err));
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Flushed tests.');
        const server = yield extra_utils_1.flushAndRunServer(6);
        process.on('exit', () => __awaiter(this, void 0, void 0, function* () {
            extra_utils_1.killallServers([server]);
            return;
        }));
        process.on('SIGINT', goodbye);
        process.on('SIGTERM', goodbye);
        yield extra_utils_1.setAccessTokensToServers([server]);
        console.log('Servers ran.');
        const fakeTab = Array.from(Array(1000000).keys());
        const funs = [
            uploadCustom
        ];
        const promises = [];
        for (const fun of funs) {
            promises.push(Bluebird.map(fakeTab, () => {
                return fun(server).catch(err => console.error(err));
            }, { concurrency: 3 }));
        }
        yield Promise.all(promises);
    });
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function createCustomChannel(server) {
    const videoChannel = {
        name: Date.now().toString(),
        displayName: Date.now().toString(),
        description: Date.now().toString()
    };
    return extra_utils_1.addVideoChannel(server.url, server.accessToken, videoChannel);
}
function createUserCustom(server) {
    const username = Date.now().toString() + getRandomInt(0, 100000);
    console.log('Creating user %s.', username);
    return extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: username, password: 'coucou' });
}
function uploadCustom(server) {
    console.log('Uploading video.');
    const videoAttributes = {
        name: Date.now() + ' name',
        category: 4,
        nsfw: false,
        licence: 2,
        language: 'en',
        description: Date.now() + ' description',
        tags: [Date.now().toString().substring(0, 5) + 't1', Date.now().toString().substring(0, 5) + 't2'],
        fixture: 'video_short.mp4'
    };
    return extra_utils_1.uploadVideo(server.url, server.accessToken, videoAttributes);
}
function likeCustom(server) {
    return rateCustom(server, 'like');
}
function dislikeCustom(server) {
    return rateCustom(server, 'dislike');
}
function rateCustom(server, rating) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield extra_utils_1.getVideosList(server.url);
        const videos = res.body.data;
        if (videos.length === 0)
            return undefined;
        const videoToRate = videos[getRandomInt(0, videos.length)];
        console.log('Rating (%s) video.', rating);
        return extra_utils_1.rateVideo(server.url, server.accessToken, videoToRate.id, rating);
    });
}
function goodbye() {
    return process.exit(-1);
}
