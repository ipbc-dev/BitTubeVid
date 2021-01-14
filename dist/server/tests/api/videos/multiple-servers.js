"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const path_1 = require("path");
const request = require("supertest");
const extra_utils_1 = require("../../../../shared/extra-utils");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
describe('Test multiple servers', function () {
    let servers = [];
    const toRemove = [];
    let videoUUID = '';
    let videoChannelId;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(3);
            yield extra_utils_1.setAccessTokensToServers(servers);
            {
                const videoChannel = {
                    name: 'super_channel_name',
                    displayName: 'my channel',
                    description: 'super channel'
                };
                yield extra_utils_1.addVideoChannel(servers[0].url, servers[0].accessToken, videoChannel);
                const channelRes = yield extra_utils_1.getVideoChannelsList(servers[0].url, 0, 1);
                videoChannelId = channelRes.body.data[0].id;
            }
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield extra_utils_1.doubleFollow(servers[0], servers[2]);
            yield extra_utils_1.doubleFollow(servers[1], servers[2]);
        });
    });
    it('Should not have videos for all servers', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const videos = res.body.data;
                expect(videos).to.be.an('array');
                expect(videos.length).to.equal(0);
            }
        });
    });
    describe('Should upload the video and propagate on each server', function () {
        it('Should upload the video on server 1 and propagate on each server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(25000);
                const videoAttributes = {
                    name: 'my super name for server 1',
                    category: 5,
                    licence: 4,
                    language: 'ja',
                    nsfw: true,
                    description: 'my super description for server 1',
                    support: 'my super support text for server 1',
                    originallyPublishedAt: '2019-02-10T13:38:14.449Z',
                    tags: ['tag1p1', 'tag2p1'],
                    channelId: videoChannelId,
                    fixture: 'video_short1.webm'
                };
                yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
                yield jobs_1.waitJobs(servers);
                let publishedAt = null;
                for (const server of servers) {
                    const isLocal = server.port === servers[0].port;
                    const checkAttributes = {
                        name: 'my super name for server 1',
                        category: 5,
                        licence: 4,
                        language: 'ja',
                        nsfw: true,
                        description: 'my super description for server 1',
                        support: 'my super support text for server 1',
                        originallyPublishedAt: '2019-02-10T13:38:14.449Z',
                        account: {
                            name: 'root',
                            host: 'localhost:' + servers[0].port
                        },
                        isLocal,
                        publishedAt,
                        duration: 10,
                        tags: ['tag1p1', 'tag2p1'],
                        privacy: 1,
                        commentsEnabled: true,
                        downloadEnabled: true,
                        channel: {
                            displayName: 'my channel',
                            name: 'super_channel_name',
                            description: 'super channel',
                            isLocal
                        },
                        fixture: 'video_short1.webm',
                        files: [
                            {
                                resolution: 720,
                                size: 572456
                            }
                        ]
                    };
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    expect(videos).to.be.an('array');
                    expect(videos.length).to.equal(1);
                    const video = videos[0];
                    yield extra_utils_1.completeVideoCheck(server.url, video, checkAttributes);
                    publishedAt = video.publishedAt;
                }
            });
        });
        it('Should upload the video on server 2 and propagate on each server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(100000);
                const user = {
                    username: 'user1',
                    password: 'super_password'
                };
                yield extra_utils_1.createUser({ url: servers[1].url, accessToken: servers[1].accessToken, username: user.username, password: user.password });
                const userAccessToken = yield extra_utils_1.userLogin(servers[1], user);
                const videoAttributes = {
                    name: 'my super name for server 2',
                    category: 4,
                    licence: 3,
                    language: 'de',
                    nsfw: true,
                    description: 'my super description for server 2',
                    support: 'my super support text for server 2',
                    tags: ['tag1p2', 'tag2p2', 'tag3p2'],
                    fixture: 'video_short2.webm',
                    thumbnailfile: 'thumbnail.jpg',
                    previewfile: 'preview.jpg'
                };
                yield extra_utils_1.uploadVideo(servers[1].url, userAccessToken, videoAttributes);
                yield jobs_1.waitJobs(servers);
                for (const server of servers) {
                    const isLocal = server.url === 'http://localhost:' + servers[1].port;
                    const checkAttributes = {
                        name: 'my super name for server 2',
                        category: 4,
                        licence: 3,
                        language: 'de',
                        nsfw: true,
                        description: 'my super description for server 2',
                        support: 'my super support text for server 2',
                        account: {
                            name: 'user1',
                            host: 'localhost:' + servers[1].port
                        },
                        isLocal,
                        commentsEnabled: true,
                        downloadEnabled: true,
                        duration: 5,
                        tags: ['tag1p2', 'tag2p2', 'tag3p2'],
                        privacy: 1,
                        channel: {
                            displayName: 'Main user1 channel',
                            name: 'user1_channel',
                            description: 'super channel',
                            isLocal
                        },
                        fixture: 'video_short2.webm',
                        files: [
                            {
                                resolution: 240,
                                size: 270000
                            },
                            {
                                resolution: 360,
                                size: 359000
                            },
                            {
                                resolution: 480,
                                size: 465000
                            },
                            {
                                resolution: 720,
                                size: 788000
                            }
                        ],
                        thumbnailfile: 'thumbnail',
                        previewfile: 'preview'
                    };
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    expect(videos).to.be.an('array');
                    expect(videos.length).to.equal(2);
                    const video = videos[1];
                    yield extra_utils_1.completeVideoCheck(server.url, video, checkAttributes);
                }
            });
        });
        it('Should upload two videos on server 3 and propagate on each server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(45000);
                const videoAttributes1 = {
                    name: 'my super name for server 3',
                    category: 6,
                    licence: 5,
                    language: 'de',
                    nsfw: true,
                    description: 'my super description for server 3',
                    support: 'my super support text for server 3',
                    tags: ['tag1p3'],
                    fixture: 'video_short3.webm'
                };
                yield extra_utils_1.uploadVideo(servers[2].url, servers[2].accessToken, videoAttributes1);
                const videoAttributes2 = {
                    name: 'my super name for server 3-2',
                    category: 7,
                    licence: 6,
                    language: 'ko',
                    nsfw: false,
                    description: 'my super description for server 3-2',
                    support: 'my super support text for server 3-2',
                    tags: ['tag2p3', 'tag3p3', 'tag4p3'],
                    fixture: 'video_short.webm'
                };
                yield extra_utils_1.uploadVideo(servers[2].url, servers[2].accessToken, videoAttributes2);
                yield jobs_1.waitJobs(servers);
                for (const server of servers) {
                    const isLocal = server.url === 'http://localhost:' + servers[2].port;
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    expect(videos).to.be.an('array');
                    expect(videos.length).to.equal(4);
                    let video1 = null;
                    let video2 = null;
                    if (videos[2].name === 'my super name for server 3') {
                        video1 = videos[2];
                        video2 = videos[3];
                    }
                    else {
                        video1 = videos[3];
                        video2 = videos[2];
                    }
                    const checkAttributesVideo1 = {
                        name: 'my super name for server 3',
                        category: 6,
                        licence: 5,
                        language: 'de',
                        nsfw: true,
                        description: 'my super description for server 3',
                        support: 'my super support text for server 3',
                        account: {
                            name: 'root',
                            host: 'localhost:' + servers[2].port
                        },
                        isLocal,
                        duration: 5,
                        commentsEnabled: true,
                        downloadEnabled: true,
                        tags: ['tag1p3'],
                        privacy: 1,
                        channel: {
                            displayName: 'Main root channel',
                            name: 'root_channel',
                            description: '',
                            isLocal
                        },
                        fixture: 'video_short3.webm',
                        files: [
                            {
                                resolution: 720,
                                size: 292677
                            }
                        ]
                    };
                    yield extra_utils_1.completeVideoCheck(server.url, video1, checkAttributesVideo1);
                    const checkAttributesVideo2 = {
                        name: 'my super name for server 3-2',
                        category: 7,
                        licence: 6,
                        language: 'ko',
                        nsfw: false,
                        description: 'my super description for server 3-2',
                        support: 'my super support text for server 3-2',
                        account: {
                            name: 'root',
                            host: 'localhost:' + servers[2].port
                        },
                        commentsEnabled: true,
                        downloadEnabled: true,
                        isLocal,
                        duration: 5,
                        tags: ['tag2p3', 'tag3p3', 'tag4p3'],
                        privacy: 1,
                        channel: {
                            displayName: 'Main root channel',
                            name: 'root_channel',
                            description: '',
                            isLocal
                        },
                        fixture: 'video_short.webm',
                        files: [
                            {
                                resolution: 720,
                                size: 218910
                            }
                        ]
                    };
                    yield extra_utils_1.completeVideoCheck(server.url, video2, checkAttributesVideo2);
                }
            });
        });
    });
    describe('It should list local videos', function () {
        it('Should list only local videos on server 1', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const { body } = yield extra_utils_1.getLocalVideos(servers[0].url);
                expect(body.total).to.equal(1);
                expect(body.data).to.be.an('array');
                expect(body.data.length).to.equal(1);
                expect(body.data[0].name).to.equal('my super name for server 1');
            });
        });
        it('Should list only local videos on server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const { body } = yield extra_utils_1.getLocalVideos(servers[1].url);
                expect(body.total).to.equal(1);
                expect(body.data).to.be.an('array');
                expect(body.data.length).to.equal(1);
                expect(body.data[0].name).to.equal('my super name for server 2');
            });
        });
        it('Should list only local videos on server 3', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const { body } = yield extra_utils_1.getLocalVideos(servers[2].url);
                expect(body.total).to.equal(2);
                expect(body.data).to.be.an('array');
                expect(body.data.length).to.equal(2);
                expect(body.data[0].name).to.equal('my super name for server 3');
                expect(body.data[1].name).to.equal('my super name for server 3-2');
            });
        });
    });
    describe('Should seed the uploaded video', function () {
        it('Should add the file 1 by asking server 3', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const res = yield extra_utils_1.getVideosList(servers[2].url);
                const video = res.body.data[0];
                toRemove.push(res.body.data[2]);
                toRemove.push(res.body.data[3]);
                const res2 = yield extra_utils_1.getVideo(servers[2].url, video.id);
                const videoDetails = res2.body;
                const torrent = yield extra_utils_1.webtorrentAdd(videoDetails.files[0].magnetUri, true);
                expect(torrent.files).to.be.an('array');
                expect(torrent.files.length).to.equal(1);
                expect(torrent.files[0].path).to.exist.and.to.not.equal('');
            });
        });
        it('Should add the file 2 by asking server 1', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                const video = res.body.data[1];
                const res2 = yield extra_utils_1.getVideo(servers[0].url, video.id);
                const videoDetails = res2.body;
                const torrent = yield extra_utils_1.webtorrentAdd(videoDetails.files[0].magnetUri, true);
                expect(torrent.files).to.be.an('array');
                expect(torrent.files.length).to.equal(1);
                expect(torrent.files[0].path).to.exist.and.to.not.equal('');
            });
        });
        it('Should add the file 3 by asking server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const res = yield extra_utils_1.getVideosList(servers[1].url);
                const video = res.body.data[2];
                const res2 = yield extra_utils_1.getVideo(servers[1].url, video.id);
                const videoDetails = res2.body;
                const torrent = yield extra_utils_1.webtorrentAdd(videoDetails.files[0].magnetUri, true);
                expect(torrent.files).to.be.an('array');
                expect(torrent.files.length).to.equal(1);
                expect(torrent.files[0].path).to.exist.and.to.not.equal('');
            });
        });
        it('Should add the file 3-2 by asking server 1', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                const video = res.body.data[3];
                const res2 = yield extra_utils_1.getVideo(servers[0].url, video.id);
                const videoDetails = res2.body;
                const torrent = yield extra_utils_1.webtorrentAdd(videoDetails.files[0].magnetUri);
                expect(torrent.files).to.be.an('array');
                expect(torrent.files.length).to.equal(1);
                expect(torrent.files[0].path).to.exist.and.to.not.equal('');
            });
        });
        it('Should add the file 2 in 360p by asking server 1', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                const video = res.body.data.find(v => v.name === 'my super name for server 2');
                const res2 = yield extra_utils_1.getVideo(servers[0].url, video.id);
                const videoDetails = res2.body;
                const file = videoDetails.files.find(f => f.resolution.id === 360);
                expect(file).not.to.be.undefined;
                const torrent = yield extra_utils_1.webtorrentAdd(file.magnetUri);
                expect(torrent.files).to.be.an('array');
                expect(torrent.files.length).to.equal(1);
                expect(torrent.files[0].path).to.exist.and.to.not.equal('');
            });
        });
    });
    describe('Should update video views, likes and dislikes', function () {
        let localVideosServer3 = [];
        let remoteVideosServer1 = [];
        let remoteVideosServer2 = [];
        let remoteVideosServer3 = [];
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res1 = yield extra_utils_1.getVideosList(servers[0].url);
                remoteVideosServer1 = res1.body.data.filter(video => video.isLocal === false).map(video => video.uuid);
                const res2 = yield extra_utils_1.getVideosList(servers[1].url);
                remoteVideosServer2 = res2.body.data.filter(video => video.isLocal === false).map(video => video.uuid);
                const res3 = yield extra_utils_1.getVideosList(servers[2].url);
                localVideosServer3 = res3.body.data.filter(video => video.isLocal === true).map(video => video.uuid);
                remoteVideosServer3 = res3.body.data.filter(video => video.isLocal === false).map(video => video.uuid);
            });
        });
        it('Should view multiple videos on owned servers', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.viewVideo(servers[2].url, localVideosServer3[0]);
                yield extra_utils_1.wait(1000);
                yield extra_utils_1.viewVideo(servers[2].url, localVideosServer3[0]);
                yield extra_utils_1.viewVideo(servers[2].url, localVideosServer3[1]);
                yield extra_utils_1.wait(1000);
                yield extra_utils_1.viewVideo(servers[2].url, localVideosServer3[0]);
                yield extra_utils_1.viewVideo(servers[2].url, localVideosServer3[0]);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(6000);
                yield jobs_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    const video0 = videos.find(v => v.uuid === localVideosServer3[0]);
                    const video1 = videos.find(v => v.uuid === localVideosServer3[1]);
                    expect(video0.views).to.equal(3);
                    expect(video1.views).to.equal(1);
                }
            });
        });
        it('Should view multiple videos on each servers', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(45000);
                const tasks = [];
                tasks.push(extra_utils_1.viewVideo(servers[0].url, remoteVideosServer1[0]));
                tasks.push(extra_utils_1.viewVideo(servers[1].url, remoteVideosServer2[0]));
                tasks.push(extra_utils_1.viewVideo(servers[1].url, remoteVideosServer2[0]));
                tasks.push(extra_utils_1.viewVideo(servers[2].url, remoteVideosServer3[0]));
                tasks.push(extra_utils_1.viewVideo(servers[2].url, remoteVideosServer3[1]));
                tasks.push(extra_utils_1.viewVideo(servers[2].url, remoteVideosServer3[1]));
                tasks.push(extra_utils_1.viewVideo(servers[2].url, remoteVideosServer3[1]));
                tasks.push(extra_utils_1.viewVideo(servers[2].url, localVideosServer3[1]));
                tasks.push(extra_utils_1.viewVideo(servers[2].url, localVideosServer3[1]));
                tasks.push(extra_utils_1.viewVideo(servers[2].url, localVideosServer3[1]));
                yield Promise.all(tasks);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(16000);
                yield jobs_1.waitJobs(servers);
                let baseVideos = null;
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    if (baseVideos === null) {
                        baseVideos = videos;
                        continue;
                    }
                    for (const baseVideo of baseVideos) {
                        const sameVideo = videos.find(video => video.name === baseVideo.name);
                        expect(baseVideo.views).to.equal(sameVideo.views);
                    }
                }
            });
        });
        it('Should like and dislikes videos on different services', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.rateVideo(servers[0].url, servers[0].accessToken, remoteVideosServer1[0], 'like');
                yield extra_utils_1.wait(500);
                yield extra_utils_1.rateVideo(servers[0].url, servers[0].accessToken, remoteVideosServer1[0], 'dislike');
                yield extra_utils_1.wait(500);
                yield extra_utils_1.rateVideo(servers[0].url, servers[0].accessToken, remoteVideosServer1[0], 'like');
                yield extra_utils_1.rateVideo(servers[2].url, servers[2].accessToken, localVideosServer3[1], 'like');
                yield extra_utils_1.wait(500);
                yield extra_utils_1.rateVideo(servers[2].url, servers[2].accessToken, localVideosServer3[1], 'dislike');
                yield extra_utils_1.rateVideo(servers[2].url, servers[2].accessToken, remoteVideosServer3[1], 'dislike');
                yield extra_utils_1.wait(500);
                yield extra_utils_1.rateVideo(servers[2].url, servers[2].accessToken, remoteVideosServer3[0], 'like');
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(5000);
                let baseVideos = null;
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    if (baseVideos === null) {
                        baseVideos = videos;
                        continue;
                    }
                    for (const baseVideo of baseVideos) {
                        const sameVideo = videos.find(video => video.name === baseVideo.name);
                        expect(baseVideo.likes).to.equal(sameVideo.likes);
                        expect(baseVideo.dislikes).to.equal(sameVideo.dislikes);
                    }
                }
            });
        });
    });
    describe('Should manipulate these videos', function () {
        it('Should update the video 3 by asking server 3', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const attributes = {
                    name: 'my super video updated',
                    category: 10,
                    licence: 7,
                    language: 'fr',
                    nsfw: true,
                    description: 'my super description updated',
                    support: 'my super support text updated',
                    tags: ['tag_up_1', 'tag_up_2'],
                    thumbnailfile: 'thumbnail.jpg',
                    originallyPublishedAt: '2019-02-11T13:38:14.449Z',
                    previewfile: 'preview.jpg'
                };
                yield extra_utils_1.updateVideo(servers[2].url, servers[2].accessToken, toRemove[0].id, attributes);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have the video 3 updated on each server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    const videoUpdated = videos.find(video => video.name === 'my super video updated');
                    expect(!!videoUpdated).to.be.true;
                    const isLocal = server.url === 'http://localhost:' + servers[2].port;
                    const checkAttributes = {
                        name: 'my super video updated',
                        category: 10,
                        licence: 7,
                        language: 'fr',
                        nsfw: true,
                        description: 'my super description updated',
                        support: 'my super support text updated',
                        originallyPublishedAt: '2019-02-11T13:38:14.449Z',
                        account: {
                            name: 'root',
                            host: 'localhost:' + servers[2].port
                        },
                        isLocal,
                        duration: 5,
                        commentsEnabled: true,
                        downloadEnabled: true,
                        tags: ['tag_up_1', 'tag_up_2'],
                        privacy: 1,
                        channel: {
                            displayName: 'Main root channel',
                            name: 'root_channel',
                            description: '',
                            isLocal
                        },
                        fixture: 'video_short3.webm',
                        files: [
                            {
                                resolution: 720,
                                size: 292677
                            }
                        ],
                        thumbnailfile: 'thumbnail',
                        previewfile: 'preview'
                    };
                    yield extra_utils_1.completeVideoCheck(server.url, videoUpdated, checkAttributes);
                }
            });
        });
        it('Should remove the videos 3 and 3-2 by asking server 3', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.removeVideo(servers[2].url, servers[2].accessToken, toRemove[0].id);
                yield extra_utils_1.removeVideo(servers[2].url, servers[2].accessToken, toRemove[1].id);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should not have files of videos 3 and 3-2 on each server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    yield extra_utils_1.checkVideoFilesWereRemoved(toRemove[0].uuid, server.internalServerNumber);
                    yield extra_utils_1.checkVideoFilesWereRemoved(toRemove[1].uuid, server.internalServerNumber);
                }
            });
        });
        it('Should have videos 1 and 3 on each server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    expect(videos).to.be.an('array');
                    expect(videos.length).to.equal(2);
                    expect(videos[0].name).not.to.equal(videos[1].name);
                    expect(videos[0].name).not.to.equal(toRemove[0].name);
                    expect(videos[1].name).not.to.equal(toRemove[0].name);
                    expect(videos[0].name).not.to.equal(toRemove[1].name);
                    expect(videos[1].name).not.to.equal(toRemove[1].name);
                    videoUUID = videos.find(video => video.name === 'my super name for server 1').uuid;
                }
            });
        });
        it('Should get the same video by UUID on each server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                let baseVideo = null;
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideo(server.url, videoUUID);
                    const video = res.body;
                    if (baseVideo === null) {
                        baseVideo = video;
                        continue;
                    }
                    expect(baseVideo.name).to.equal(video.name);
                    expect(baseVideo.uuid).to.equal(video.uuid);
                    expect(baseVideo.category.id).to.equal(video.category.id);
                    expect(baseVideo.language.id).to.equal(video.language.id);
                    expect(baseVideo.licence.id).to.equal(video.licence.id);
                    expect(baseVideo.nsfw).to.equal(video.nsfw);
                    expect(baseVideo.account.name).to.equal(video.account.name);
                    expect(baseVideo.account.displayName).to.equal(video.account.displayName);
                    expect(baseVideo.account.url).to.equal(video.account.url);
                    expect(baseVideo.account.host).to.equal(video.account.host);
                    expect(baseVideo.tags).to.deep.equal(video.tags);
                }
            });
        });
        it('Should get the preview from each server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideo(server.url, videoUUID);
                    const video = res.body;
                    yield extra_utils_1.testImage(server.url, 'video_short1-preview.webm', video.previewPath);
                }
            });
        });
    });
    describe('Should comment these videos', function () {
        let childOfFirstChild;
        it('Should add comment (threads and replies)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(25000);
                {
                    const text = 'my super first comment';
                    yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID, text);
                }
                {
                    const text = 'my super second comment';
                    yield video_comments_1.addVideoCommentThread(servers[2].url, servers[2].accessToken, videoUUID, text);
                }
                yield jobs_1.waitJobs(servers);
                {
                    const threadId = yield video_comments_1.findCommentId(servers[1].url, videoUUID, 'my super first comment');
                    const text = 'my super answer to thread 1';
                    yield video_comments_1.addVideoCommentReply(servers[1].url, servers[1].accessToken, videoUUID, threadId, text);
                }
                yield jobs_1.waitJobs(servers);
                {
                    const threadId = yield video_comments_1.findCommentId(servers[2].url, videoUUID, 'my super first comment');
                    const res2 = yield video_comments_1.getVideoThreadComments(servers[2].url, videoUUID, threadId);
                    const childCommentId = res2.body.children[0].comment.id;
                    const text3 = 'my second answer to thread 1';
                    yield video_comments_1.addVideoCommentReply(servers[2].url, servers[2].accessToken, videoUUID, threadId, text3);
                    const text2 = 'my super answer to answer of thread 1';
                    yield video_comments_1.addVideoCommentReply(servers[2].url, servers[2].accessToken, videoUUID, childCommentId, text2);
                }
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have these threads', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5);
                    expect(res.body.total).to.equal(2);
                    expect(res.body.data).to.be.an('array');
                    expect(res.body.data).to.have.lengthOf(2);
                    {
                        const comment = res.body.data.find(c => c.text === 'my super first comment');
                        expect(comment).to.not.be.undefined;
                        expect(comment.inReplyToCommentId).to.be.null;
                        expect(comment.account.name).to.equal('root');
                        expect(comment.account.host).to.equal('localhost:' + servers[0].port);
                        expect(comment.totalReplies).to.equal(3);
                        expect(extra_utils_1.dateIsValid(comment.createdAt)).to.be.true;
                        expect(extra_utils_1.dateIsValid(comment.updatedAt)).to.be.true;
                    }
                    {
                        const comment = res.body.data.find(c => c.text === 'my super second comment');
                        expect(comment).to.not.be.undefined;
                        expect(comment.inReplyToCommentId).to.be.null;
                        expect(comment.account.name).to.equal('root');
                        expect(comment.account.host).to.equal('localhost:' + servers[2].port);
                        expect(comment.totalReplies).to.equal(0);
                        expect(extra_utils_1.dateIsValid(comment.createdAt)).to.be.true;
                        expect(extra_utils_1.dateIsValid(comment.updatedAt)).to.be.true;
                    }
                }
            });
        });
        it('Should have these comments', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res1 = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5);
                    const threadId = res1.body.data.find(c => c.text === 'my super first comment').id;
                    const res2 = yield video_comments_1.getVideoThreadComments(server.url, videoUUID, threadId);
                    const tree = res2.body;
                    expect(tree.comment.text).equal('my super first comment');
                    expect(tree.comment.account.name).equal('root');
                    expect(tree.comment.account.host).equal('localhost:' + servers[0].port);
                    expect(tree.children).to.have.lengthOf(2);
                    const firstChild = tree.children[0];
                    expect(firstChild.comment.text).to.equal('my super answer to thread 1');
                    expect(firstChild.comment.account.name).equal('root');
                    expect(firstChild.comment.account.host).equal('localhost:' + servers[1].port);
                    expect(firstChild.children).to.have.lengthOf(1);
                    childOfFirstChild = firstChild.children[0];
                    expect(childOfFirstChild.comment.text).to.equal('my super answer to answer of thread 1');
                    expect(childOfFirstChild.comment.account.name).equal('root');
                    expect(childOfFirstChild.comment.account.host).equal('localhost:' + servers[2].port);
                    expect(childOfFirstChild.children).to.have.lengthOf(0);
                    const secondChild = tree.children[1];
                    expect(secondChild.comment.text).to.equal('my second answer to thread 1');
                    expect(secondChild.comment.account.name).equal('root');
                    expect(secondChild.comment.account.host).equal('localhost:' + servers[2].port);
                    expect(secondChild.children).to.have.lengthOf(0);
                }
            });
        });
        it('Should delete a reply', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield video_comments_1.deleteVideoComment(servers[2].url, servers[2].accessToken, videoUUID, childOfFirstChild.comment.id);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have this comment marked as deleted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res1 = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5);
                    const threadId = res1.body.data.find(c => c.text === 'my super first comment').id;
                    const res2 = yield video_comments_1.getVideoThreadComments(server.url, videoUUID, threadId);
                    const tree = res2.body;
                    expect(tree.comment.text).equal('my super first comment');
                    const firstChild = tree.children[0];
                    expect(firstChild.comment.text).to.equal('my super answer to thread 1');
                    expect(firstChild.children).to.have.lengthOf(1);
                    const deletedComment = firstChild.children[0].comment;
                    expect(deletedComment.isDeleted).to.be.true;
                    expect(deletedComment.deletedAt).to.not.be.null;
                    expect(deletedComment.account).to.be.null;
                    expect(deletedComment.text).to.equal('');
                    const secondChild = tree.children[1];
                    expect(secondChild.comment.text).to.equal('my second answer to thread 1');
                }
            });
        });
        it('Should delete the thread comments', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const res = yield video_comments_1.getVideoCommentThreads(servers[0].url, videoUUID, 0, 5);
                const threadId = res.body.data.find(c => c.text === 'my super first comment').id;
                yield video_comments_1.deleteVideoComment(servers[0].url, servers[0].accessToken, videoUUID, threadId);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have the threads marked as deleted on other servers too', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5);
                    expect(res.body.total).to.equal(2);
                    expect(res.body.data).to.be.an('array');
                    expect(res.body.data).to.have.lengthOf(2);
                    {
                        const comment = res.body.data[0];
                        expect(comment).to.not.be.undefined;
                        expect(comment.inReplyToCommentId).to.be.null;
                        expect(comment.account.name).to.equal('root');
                        expect(comment.account.host).to.equal('localhost:' + servers[2].port);
                        expect(comment.totalReplies).to.equal(0);
                        expect(extra_utils_1.dateIsValid(comment.createdAt)).to.be.true;
                        expect(extra_utils_1.dateIsValid(comment.updatedAt)).to.be.true;
                    }
                    {
                        const deletedComment = res.body.data[1];
                        expect(deletedComment).to.not.be.undefined;
                        expect(deletedComment.isDeleted).to.be.true;
                        expect(deletedComment.deletedAt).to.not.be.null;
                        expect(deletedComment.text).to.equal('');
                        expect(deletedComment.inReplyToCommentId).to.be.null;
                        expect(deletedComment.account).to.be.null;
                        expect(deletedComment.totalReplies).to.equal(3);
                        expect(extra_utils_1.dateIsValid(deletedComment.createdAt)).to.be.true;
                        expect(extra_utils_1.dateIsValid(deletedComment.updatedAt)).to.be.true;
                        expect(extra_utils_1.dateIsValid(deletedComment.deletedAt)).to.be.true;
                    }
                }
            });
        });
        it('Should delete a remote thread by the origin server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(5000);
                const res = yield video_comments_1.getVideoCommentThreads(servers[0].url, videoUUID, 0, 5);
                const threadId = res.body.data.find(c => c.text === 'my super second comment').id;
                yield video_comments_1.deleteVideoComment(servers[0].url, servers[0].accessToken, videoUUID, threadId);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have the threads marked as deleted on other servers too', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5);
                    expect(res.body.total).to.equal(2);
                    expect(res.body.data).to.have.lengthOf(2);
                    {
                        const comment = res.body.data[0];
                        expect(comment.text).to.equal('');
                        expect(comment.isDeleted).to.be.true;
                        expect(comment.createdAt).to.not.be.null;
                        expect(comment.deletedAt).to.not.be.null;
                        expect(comment.account).to.be.null;
                        expect(comment.totalReplies).to.equal(0);
                    }
                    {
                        const comment = res.body.data[1];
                        expect(comment.text).to.equal('');
                        expect(comment.isDeleted).to.be.true;
                        expect(comment.createdAt).to.not.be.null;
                        expect(comment.deletedAt).to.not.be.null;
                        expect(comment.account).to.be.null;
                        expect(comment.totalReplies).to.equal(3);
                    }
                }
            });
        });
        it('Should disable comments and download', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const attributes = {
                    commentsEnabled: false,
                    downloadEnabled: false
                };
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, videoUUID, attributes);
                yield jobs_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideo(server.url, videoUUID);
                    expect(res.body.commentsEnabled).to.be.false;
                    expect(res.body.downloadEnabled).to.be.false;
                    const text = 'my super forbidden comment';
                    yield video_comments_1.addVideoCommentThread(server.url, server.accessToken, videoUUID, text, http_error_codes_1.HttpStatusCode.CONFLICT_409);
                }
            });
        });
    });
    describe('With minimum parameters', function () {
        it('Should upload and propagate the video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const path = '/api/v1/videos/upload';
                const req = request(servers[1].url)
                    .post(path)
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + servers[1].accessToken)
                    .field('name', 'minimum parameters')
                    .field('privacy', '1')
                    .field('channelId', '1');
                const filePath = path_1.join(__dirname, '..', '..', 'fixtures', 'video_short.webm');
                yield req.attach('videofile', filePath)
                    .expect(http_error_codes_1.HttpStatusCode.OK_200);
                yield jobs_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const video = res.body.data.find(v => v.name === 'minimum parameters');
                    const isLocal = server.url === 'http://localhost:' + servers[1].port;
                    const checkAttributes = {
                        name: 'minimum parameters',
                        category: null,
                        licence: null,
                        language: null,
                        nsfw: false,
                        description: null,
                        support: null,
                        account: {
                            name: 'root',
                            host: 'localhost:' + servers[1].port
                        },
                        isLocal,
                        duration: 5,
                        commentsEnabled: true,
                        downloadEnabled: true,
                        tags: [],
                        privacy: 1,
                        channel: {
                            displayName: 'Main root channel',
                            name: 'root_channel',
                            description: '',
                            isLocal
                        },
                        fixture: 'video_short.webm',
                        files: [
                            {
                                resolution: 720,
                                size: 72000
                            },
                            {
                                resolution: 480,
                                size: 45000
                            },
                            {
                                resolution: 360,
                                size: 34600
                            },
                            {
                                resolution: 240,
                                size: 24770
                            }
                        ]
                    };
                    yield extra_utils_1.completeVideoCheck(server.url, video, checkAttributes);
                }
            });
        });
    });
    describe('TMP directory', function () {
        it('Should have an empty tmp directory', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    yield extra_utils_1.checkTmpIsEmpty(server);
                }
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
