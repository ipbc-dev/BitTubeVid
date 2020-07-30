"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const video_privacy_enum_1 = require("../../../../shared/models/videos/video-privacy.enum");
const index_1 = require("../../../../shared/extra-utils/index");
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const login_1 = require("../../../../shared/extra-utils/users/login");
const users_1 = require("../../../../shared/extra-utils/users/users");
const videos_1 = require("../../../../shared/extra-utils/videos/videos");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
describe('Test video privacy', function () {
    const servers = [];
    let anotherUserToken;
    let privateVideoId;
    let privateVideoUUID;
    let internalVideoId;
    let internalVideoUUID;
    let unlistedVideoUUID;
    let nonFederatedUnlistedVideoUUID;
    let now;
    const dontFederateUnlistedConfig = {
        federation: {
            videos: {
                federate_unlisted: false
            }
        }
    };
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            servers.push(yield index_1.flushAndRunServer(1, dontFederateUnlistedConfig));
            servers.push(yield index_1.flushAndRunServer(2));
            yield index_1.setAccessTokensToServers(servers);
            yield follows_1.doubleFollow(servers[0], servers[1]);
        });
    });
    it('Should upload a private and internal videos on server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            for (const privacy of [video_privacy_enum_1.VideoPrivacy.PRIVATE, video_privacy_enum_1.VideoPrivacy.INTERNAL]) {
                const attributes = { privacy };
                yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, attributes);
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should not have these private and internal videos on server 2', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getVideosList(servers[1].url);
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.have.lengthOf(0);
        });
    });
    it('Should not list the private and internal videos for an unauthenticated user on server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getVideosList(servers[0].url);
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.have.lengthOf(0);
        });
    });
    it('Should not list the private video and list the internal video for an authenticated user on server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getVideosListWithToken(servers[0].url, servers[0].accessToken);
            expect(res.body.total).to.equal(1);
            expect(res.body.data).to.have.lengthOf(1);
            expect(res.body.data[0].privacy.id).to.equal(video_privacy_enum_1.VideoPrivacy.INTERNAL);
        });
    });
    it('Should list my (private and internal) videos', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield videos_1.getMyVideos(servers[0].url, servers[0].accessToken, 0, 10);
            expect(res.body.total).to.equal(2);
            expect(res.body.data).to.have.lengthOf(2);
            const videos = res.body.data;
            const privateVideo = videos.find(v => v.privacy.id === video_privacy_enum_1.VideoPrivacy.PRIVATE);
            privateVideoId = privateVideo.id;
            privateVideoUUID = privateVideo.uuid;
            const internalVideo = videos.find(v => v.privacy.id === video_privacy_enum_1.VideoPrivacy.INTERNAL);
            internalVideoId = internalVideo.id;
            internalVideoUUID = internalVideo.uuid;
        });
    });
    it('Should not be able to watch the private/internal video with non authenticated user', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield videos_1.getVideo(servers[0].url, privateVideoUUID, 401);
            yield videos_1.getVideo(servers[0].url, internalVideoUUID, 401);
        });
    });
    it('Should not be able to watch the private video with another user', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const user = {
                username: 'hello',
                password: 'super password'
            };
            yield users_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
            anotherUserToken = yield login_1.userLogin(servers[0], user);
            yield videos_1.getVideoWithToken(servers[0].url, anotherUserToken, privateVideoUUID, 403);
        });
    });
    it('Should be able to watch the internal video with another user', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield videos_1.getVideoWithToken(servers[0].url, anotherUserToken, internalVideoUUID, 200);
        });
    });
    it('Should be able to watch the private video with the correct user', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield videos_1.getVideoWithToken(servers[0].url, servers[0].accessToken, privateVideoUUID, 200);
        });
    });
    it('Should upload an unlisted video on server 2', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const attributes = {
                name: 'unlisted video',
                privacy: video_privacy_enum_1.VideoPrivacy.UNLISTED
            };
            yield index_1.uploadVideo(servers[1].url, servers[1].accessToken, attributes);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should not have this unlisted video listed on server 1 and 2', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield index_1.getVideosList(server.url);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.have.lengthOf(0);
            }
        });
    });
    it('Should list my (unlisted) videos', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield videos_1.getMyVideos(servers[1].url, servers[1].accessToken, 0, 1);
            expect(res.body.total).to.equal(1);
            expect(res.body.data).to.have.lengthOf(1);
            unlistedVideoUUID = res.body.data[0].uuid;
        });
    });
    it('Should be able to get this unlisted video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield videos_1.getVideo(server.url, unlistedVideoUUID);
                expect(res.body.name).to.equal('unlisted video');
            }
        });
    });
    it('Should upload a non-federating unlisted video to server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const attributes = {
                name: 'unlisted video',
                privacy: video_privacy_enum_1.VideoPrivacy.UNLISTED
            };
            yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, attributes);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should list my new unlisted video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield videos_1.getMyVideos(servers[0].url, servers[0].accessToken, 0, 3);
            expect(res.body.total).to.equal(3);
            expect(res.body.data).to.have.lengthOf(3);
            nonFederatedUnlistedVideoUUID = res.body.data[0].uuid;
        });
    });
    it('Should be able to get non-federated unlisted video from origin', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield videos_1.getVideo(servers[0].url, nonFederatedUnlistedVideoUUID);
            expect(res.body.name).to.equal('unlisted video');
        });
    });
    it('Should not be able to get non-federated unlisted video from federated server', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield videos_1.getVideo(servers[1].url, nonFederatedUnlistedVideoUUID, 404);
        });
    });
    it('Should update the private and internal videos to public on server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            now = Date.now();
            {
                const attribute = {
                    name: 'private video becomes public',
                    privacy: video_privacy_enum_1.VideoPrivacy.PUBLIC
                };
                yield videos_1.updateVideo(servers[0].url, servers[0].accessToken, privateVideoId, attribute);
            }
            {
                const attribute = {
                    name: 'internal video becomes public',
                    privacy: video_privacy_enum_1.VideoPrivacy.PUBLIC
                };
                yield videos_1.updateVideo(servers[0].url, servers[0].accessToken, internalVideoId, attribute);
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have this new public video listed on server 1 and 2', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield index_1.getVideosList(server.url);
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(2);
                const videos = res.body.data;
                const privateVideo = videos.find(v => v.name === 'private video becomes public');
                const internalVideo = videos.find(v => v.name === 'internal video becomes public');
                expect(privateVideo).to.not.be.undefined;
                expect(internalVideo).to.not.be.undefined;
                expect(new Date(privateVideo.publishedAt).getTime()).to.be.at.least(now);
                expect(new Date(internalVideo.publishedAt).getTime()).to.be.below(now);
                expect(privateVideo.privacy.id).to.equal(video_privacy_enum_1.VideoPrivacy.PUBLIC);
                expect(internalVideo.privacy.id).to.equal(video_privacy_enum_1.VideoPrivacy.PUBLIC);
            }
        });
    });
    it('Should set these videos as private and internal', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield videos_1.updateVideo(servers[0].url, servers[0].accessToken, internalVideoId, { privacy: video_privacy_enum_1.VideoPrivacy.PRIVATE });
            yield videos_1.updateVideo(servers[0].url, servers[0].accessToken, privateVideoId, { privacy: video_privacy_enum_1.VideoPrivacy.INTERNAL });
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield index_1.getVideosList(server.url);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.have.lengthOf(0);
            }
            {
                const res = yield videos_1.getMyVideos(servers[0].url, servers[0].accessToken, 0, 5);
                const videos = res.body.data;
                expect(res.body.total).to.equal(3);
                expect(videos).to.have.lengthOf(3);
                const privateVideo = videos.find(v => v.name === 'private video becomes public');
                const internalVideo = videos.find(v => v.name === 'internal video becomes public');
                expect(privateVideo).to.not.be.undefined;
                expect(internalVideo).to.not.be.undefined;
                expect(privateVideo.privacy.id).to.equal(video_privacy_enum_1.VideoPrivacy.INTERNAL);
                expect(internalVideo.privacy.id).to.equal(video_privacy_enum_1.VideoPrivacy.PRIVATE);
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});
