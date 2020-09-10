"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const models_1 = require("@shared/models");
const extra_utils_1 = require("../../../../shared/extra-utils");
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const login_1 = require("../../../../shared/extra-utils/users/login");
const videos_1 = require("../../../../shared/extra-utils/videos/videos");
const expect = chai.expect;
describe('Test users', function () {
    let server;
    let accessToken;
    let accessTokenUser;
    let videoId;
    let userId;
    const user = {
        username: 'user_1',
        password: 'super password'
    };
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1, {
                rates_limit: {
                    login: {
                        max: 30
                    }
                }
            });
            yield login_1.setAccessTokensToServers([server]);
            yield extra_utils_1.installPlugin({ url: server.url, accessToken: server.accessToken, npmName: 'peertube-theme-background-red' });
        });
    });
    describe('OAuth client', function () {
        it('Should create a new client');
        it('Should return the first client');
        it('Should remove the last client');
        it('Should not login with an invalid client id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = { id: 'client', secret: server.client.secret };
                const res = yield extra_utils_1.login(server.url, client, server.user, 400);
                expect(res.body.error).to.contain('client is invalid');
            });
        });
        it('Should not login with an invalid client secret', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const client = { id: server.client.id, secret: 'coucou' };
                const res = yield extra_utils_1.login(server.url, client, server.user, 400);
                expect(res.body.error).to.contain('client is invalid');
            });
        });
    });
    describe('Login', function () {
        it('Should not login with an invalid username', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const user = { username: 'captain crochet', password: server.user.password };
                const res = yield extra_utils_1.login(server.url, server.client, user, 400);
                expect(res.body.error).to.contain('credentials are invalid');
            });
        });
        it('Should not login with an invalid password', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const user = { username: server.user.username, password: 'mew_three' };
                const res = yield extra_utils_1.login(server.url, server.client, user, 400);
                expect(res.body.error).to.contain('credentials are invalid');
            });
        });
        it('Should not be able to upload a video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                accessToken = 'my_super_token';
                const videoAttributes = {};
                yield extra_utils_1.uploadVideo(server.url, accessToken, videoAttributes, 401);
            });
        });
        it('Should not be able to follow', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                accessToken = 'my_super_token';
                yield follows_1.follow(server.url, ['http://example.com'], accessToken, 401);
            });
        });
        it('Should not be able to unfollow');
        it('Should be able to login', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.login(server.url, server.client, server.user, 200);
                accessToken = res.body.access_token;
            });
        });
        it('Should be able to login with an insensitive username', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const user = { username: 'RoOt', password: server.user.password };
                yield extra_utils_1.login(server.url, server.client, user, 200);
                const user2 = { username: 'rOoT', password: server.user.password };
                yield extra_utils_1.login(server.url, server.client, user2, 200);
                const user3 = { username: 'ROOt', password: server.user.password };
                yield extra_utils_1.login(server.url, server.client, user3, 200);
            });
        });
    });
    describe('Upload', function () {
        it('Should upload the video with the correct token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const videoAttributes = {};
                yield extra_utils_1.uploadVideo(server.url, accessToken, videoAttributes);
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data[0];
                expect(video.account.name).to.equal('root');
                videoId = video.id;
            });
        });
        it('Should upload the video again with the correct token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const videoAttributes = {};
                yield extra_utils_1.uploadVideo(server.url, accessToken, videoAttributes);
            });
        });
    });
    describe('Ratings', function () {
        it('Should retrieve a video rating', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.rateVideo(server.url, accessToken, videoId, 'like');
                const res = yield extra_utils_1.getMyUserVideoRating(server.url, accessToken, videoId);
                const rating = res.body;
                expect(rating.videoId).to.equal(videoId);
                expect(rating.rating).to.equal('like');
            });
        });
        it('Should retrieve ratings list', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.rateVideo(server.url, accessToken, videoId, 'like');
                const res = yield extra_utils_1.getAccountRatings(server.url, server.user.username, server.accessToken, null, 200);
                const ratings = res.body;
                expect(ratings.total).to.equal(1);
                expect(ratings.data[0].video.id).to.equal(videoId);
                expect(ratings.data[0].rating).to.equal('like');
            });
        });
        it('Should retrieve ratings list by rating type', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield extra_utils_1.getAccountRatings(server.url, server.user.username, server.accessToken, 'like');
                    const ratings = res.body;
                    expect(ratings.data.length).to.equal(1);
                }
                {
                    const res = yield extra_utils_1.getAccountRatings(server.url, server.user.username, server.accessToken, 'dislike');
                    const ratings = res.body;
                    expect(ratings.data.length).to.equal(0);
                }
            });
        });
    });
    describe('Remove video', function () {
        it('Should not be able to remove the video with an incorrect token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideo(server.url, 'bad_token', videoId, 401);
            });
        });
        it('Should not be able to remove the video with the token of another account');
        it('Should be able to remove the video with the correct token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideo(server.url, accessToken, videoId);
            });
        });
    });
    describe('Logout', function () {
        it('Should logout (revoke token)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield login_1.logout(server.url, server.accessToken);
            });
        });
        it('Should not be able to get the user information', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getMyUserInformation(server.url, server.accessToken, 401);
            });
        });
        it('Should not be able to upload a video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'video' }, 401);
            });
        });
        it('Should not be able to rate a video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/api/v1/videos/';
                const data = {
                    rating: 'likes'
                };
                const options = {
                    url: server.url,
                    path: path + videoId,
                    token: 'wrong token',
                    fields: data,
                    statusCodeExpected: 401
                };
                yield extra_utils_1.makePutBodyRequest(options);
            });
        });
        it('Should be able to login again', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                server.accessToken = yield login_1.serverLogin(server);
            });
        });
        it('Should have an expired access token');
        it('Should refresh the token');
        it('Should be able to get my user information again', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getMyUserInformation(server.url, server.accessToken);
            });
        });
    });
    describe('Creating a user', function () {
        it('Should be able to create a new user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.createUser({
                    url: server.url,
                    accessToken: accessToken,
                    username: user.username,
                    password: user.password,
                    videoQuota: 2 * 1024 * 1024,
                    adminFlags: 1
                });
            });
        });
        it('Should be able to login with this user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                accessTokenUser = yield extra_utils_1.userLogin(server, user);
            });
        });
        it('Should be able to get user information', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res1 = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const userMe = res1.body;
                const res2 = yield extra_utils_1.getUserInformation(server.url, server.accessToken, userMe.id, true);
                const userGet = res2.body;
                for (const user of [userMe, userGet]) {
                    expect(user.username).to.equal('user_1');
                    expect(user.email).to.equal('user_1@example.com');
                    expect(user.nsfwPolicy).to.equal('display');
                    expect(user.videoQuota).to.equal(2 * 1024 * 1024);
                    expect(user.roleLabel).to.equal('User');
                    expect(user.id).to.be.a('number');
                    expect(user.account.displayName).to.equal('user_1');
                    expect(user.account.description).to.be.null;
                }
                expect(userMe.adminFlags).to.be.undefined;
                expect(userGet.adminFlags).to.equal(1);
                expect(userMe.specialPlaylists).to.have.lengthOf(1);
                expect(userMe.specialPlaylists[0].type).to.equal(2);
                expect(userGet.videosCount).to.be.a('number');
                expect(userGet.videosCount).to.equal(0);
                expect(userGet.videoCommentsCount).to.be.a('number');
                expect(userGet.videoCommentsCount).to.equal(0);
                expect(userGet.abusesCount).to.be.a('number');
                expect(userGet.abusesCount).to.equal(0);
                expect(userGet.abusesAcceptedCount).to.be.a('number');
                expect(userGet.abusesAcceptedCount).to.equal(0);
            });
        });
    });
    describe('My videos & quotas', function () {
        it('Should be able to upload a video with this user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const videoAttributes = {
                    name: 'super user video',
                    fixture: 'video_short.webm'
                };
                yield extra_utils_1.uploadVideo(server.url, accessTokenUser, videoAttributes);
            });
        });
        it('Should have video quota updated', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getMyUserVideoQuotaUsed(server.url, accessTokenUser);
                const data = res.body;
                expect(data.videoQuotaUsed).to.equal(218910);
                const resUsers = yield extra_utils_1.getUsersList(server.url, server.accessToken);
                const users = resUsers.body.data;
                const tmpUser = users.find(u => u.username === user.username);
                expect(tmpUser.videoQuotaUsed).to.equal(218910);
            });
        });
        it('Should be able to list my videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield videos_1.getMyVideos(server.url, accessTokenUser, 0, 5);
                expect(res.body.total).to.equal(1);
                const videos = res.body.data;
                expect(videos).to.have.lengthOf(1);
                const video = videos[0];
                expect(video.name).to.equal('super user video');
                expect(video.thumbnailPath).to.not.be.null;
                expect(video.previewPath).to.not.be.null;
            });
        });
        it('Should be able to search in my videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield videos_1.getMyVideos(server.url, accessTokenUser, 0, 5, '-createdAt', 'user video');
                    expect(res.body.total).to.equal(1);
                    const videos = res.body.data;
                    expect(videos).to.have.lengthOf(1);
                }
                {
                    const res = yield videos_1.getMyVideos(server.url, accessTokenUser, 0, 5, '-createdAt', 'toto');
                    expect(res.body.total).to.equal(0);
                    const videos = res.body.data;
                    expect(videos).to.have.lengthOf(0);
                }
            });
        });
        it('Should disable webtorrent, enable HLS, and update my quota', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                {
                    const res = yield extra_utils_1.getCustomConfig(server.url, server.accessToken);
                    const config = res.body;
                    config.transcoding.webtorrent.enabled = false;
                    config.transcoding.hls.enabled = true;
                    config.transcoding.enabled = true;
                    yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, config);
                }
                {
                    const videoAttributes = {
                        name: 'super user video 2',
                        fixture: 'video_short.webm'
                    };
                    yield extra_utils_1.uploadVideo(server.url, accessTokenUser, videoAttributes);
                    yield extra_utils_1.waitJobs([server]);
                }
                {
                    const res = yield extra_utils_1.getMyUserVideoQuotaUsed(server.url, accessTokenUser);
                    const data = res.body;
                    expect(data.videoQuotaUsed).to.be.greaterThan(220000);
                }
            });
        });
    });
    describe('Users listing', function () {
        it('Should list all the users', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getUsersList(server.url, server.accessToken);
                const result = res.body;
                const total = result.total;
                const users = result.data;
                expect(total).to.equal(2);
                expect(users).to.be.an('array');
                expect(users.length).to.equal(2);
                const user = users[0];
                expect(user.username).to.equal('user_1');
                expect(user.email).to.equal('user_1@example.com');
                expect(user.nsfwPolicy).to.equal('display');
                const rootUser = users[1];
                expect(rootUser.username).to.equal('root');
                expect(rootUser.email).to.equal('admin' + server.internalServerNumber + '@example.com');
                expect(user.nsfwPolicy).to.equal('display');
                expect(rootUser.lastLoginDate).to.exist;
                expect(user.lastLoginDate).to.exist;
                userId = user.id;
            });
        });
        it('Should list only the first user by username asc', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getUsersListPaginationAndSort(server.url, server.accessToken, 0, 1, 'username');
                const result = res.body;
                const total = result.total;
                const users = result.data;
                expect(total).to.equal(2);
                expect(users.length).to.equal(1);
                const user = users[0];
                expect(user.username).to.equal('root');
                expect(user.email).to.equal('admin' + server.internalServerNumber + '@example.com');
                expect(user.roleLabel).to.equal('Administrator');
                expect(user.nsfwPolicy).to.equal('display');
            });
        });
        it('Should list only the first user by username desc', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getUsersListPaginationAndSort(server.url, server.accessToken, 0, 1, '-username');
                const result = res.body;
                const total = result.total;
                const users = result.data;
                expect(total).to.equal(2);
                expect(users.length).to.equal(1);
                const user = users[0];
                expect(user.username).to.equal('user_1');
                expect(user.email).to.equal('user_1@example.com');
                expect(user.nsfwPolicy).to.equal('display');
            });
        });
        it('Should list only the second user by createdAt desc', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getUsersListPaginationAndSort(server.url, server.accessToken, 0, 1, '-createdAt');
                const result = res.body;
                const total = result.total;
                const users = result.data;
                expect(total).to.equal(2);
                expect(users.length).to.equal(1);
                const user = users[0];
                expect(user.username).to.equal('user_1');
                expect(user.email).to.equal('user_1@example.com');
                expect(user.nsfwPolicy).to.equal('display');
            });
        });
        it('Should list all the users by createdAt asc', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getUsersListPaginationAndSort(server.url, server.accessToken, 0, 2, 'createdAt');
                const result = res.body;
                const total = result.total;
                const users = result.data;
                expect(total).to.equal(2);
                expect(users.length).to.equal(2);
                expect(users[0].username).to.equal('root');
                expect(users[0].email).to.equal('admin' + server.internalServerNumber + '@example.com');
                expect(users[0].nsfwPolicy).to.equal('display');
                expect(users[1].username).to.equal('user_1');
                expect(users[1].email).to.equal('user_1@example.com');
                expect(users[1].nsfwPolicy).to.equal('display');
            });
        });
        it('Should search user by username', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getUsersListPaginationAndSort(server.url, server.accessToken, 0, 2, 'createdAt', 'oot');
                const users = res.body.data;
                expect(res.body.total).to.equal(1);
                expect(users.length).to.equal(1);
                expect(users[0].username).to.equal('root');
            });
        });
        it('Should search user by email', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield extra_utils_1.getUsersListPaginationAndSort(server.url, server.accessToken, 0, 2, 'createdAt', 'r_1@exam');
                    const users = res.body.data;
                    expect(res.body.total).to.equal(1);
                    expect(users.length).to.equal(1);
                    expect(users[0].username).to.equal('user_1');
                    expect(users[0].email).to.equal('user_1@example.com');
                }
                {
                    const res = yield extra_utils_1.getUsersListPaginationAndSort(server.url, server.accessToken, 0, 2, 'createdAt', 'example');
                    const users = res.body.data;
                    expect(res.body.total).to.equal(2);
                    expect(users.length).to.equal(2);
                    expect(users[0].username).to.equal('root');
                    expect(users[1].username).to.equal('user_1');
                }
            });
        });
    });
    describe('Update my account', function () {
        it('Should update my password', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateMyUser({
                    url: server.url,
                    accessToken: accessTokenUser,
                    currentPassword: 'super password',
                    password: 'new password'
                });
                user.password = 'new password';
                yield extra_utils_1.userLogin(server, user, 200);
            });
        });
        it('Should be able to change the NSFW display attribute', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateMyUser({
                    url: server.url,
                    accessToken: accessTokenUser,
                    nsfwPolicy: 'do_not_list'
                });
                const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const user = res.body;
                expect(user.username).to.equal('user_1');
                expect(user.email).to.equal('user_1@example.com');
                expect(user.nsfwPolicy).to.equal('do_not_list');
                expect(user.videoQuota).to.equal(2 * 1024 * 1024);
                expect(user.id).to.be.a('number');
                expect(user.account.displayName).to.equal('user_1');
                expect(user.account.description).to.be.null;
            });
        });
        it('Should be able to change the autoPlayVideo attribute', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateMyUser({
                    url: server.url,
                    accessToken: accessTokenUser,
                    autoPlayVideo: false
                });
                const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const user = res.body;
                expect(user.autoPlayVideo).to.be.false;
            });
        });
        it('Should be able to change the autoPlayNextVideo attribute', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateMyUser({
                    url: server.url,
                    accessToken: accessTokenUser,
                    autoPlayNextVideo: true
                });
                const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const user = res.body;
                expect(user.autoPlayNextVideo).to.be.true;
            });
        });
        it('Should be able to change the email attribute', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateMyUser({
                    url: server.url,
                    accessToken: accessTokenUser,
                    currentPassword: 'new password',
                    email: 'updated@example.com'
                });
                const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const user = res.body;
                expect(user.username).to.equal('user_1');
                expect(user.email).to.equal('updated@example.com');
                expect(user.nsfwPolicy).to.equal('do_not_list');
                expect(user.videoQuota).to.equal(2 * 1024 * 1024);
                expect(user.id).to.be.a('number');
                expect(user.account.displayName).to.equal('user_1');
                expect(user.account.description).to.be.null;
            });
        });
        it('Should be able to update my avatar', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fixture = 'avatar.png';
                yield extra_utils_1.updateMyAvatar({
                    url: server.url,
                    accessToken: accessTokenUser,
                    fixture
                });
                const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const user = res.body;
                yield extra_utils_1.testImage(server.url, 'avatar-resized', user.account.avatar.path, '.png');
            });
        });
        it('Should be able to update my display name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateMyUser({
                    url: server.url,
                    accessToken: accessTokenUser,
                    displayName: 'new display name'
                });
                const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const user = res.body;
                expect(user.username).to.equal('user_1');
                expect(user.email).to.equal('updated@example.com');
                expect(user.nsfwPolicy).to.equal('do_not_list');
                expect(user.videoQuota).to.equal(2 * 1024 * 1024);
                expect(user.id).to.be.a('number');
                expect(user.account.displayName).to.equal('new display name');
                expect(user.account.description).to.be.null;
            });
        });
        it('Should be able to update my description', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateMyUser({
                    url: server.url,
                    accessToken: accessTokenUser,
                    description: 'my super description updated'
                });
                const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const user = res.body;
                expect(user.username).to.equal('user_1');
                expect(user.email).to.equal('updated@example.com');
                expect(user.nsfwPolicy).to.equal('do_not_list');
                expect(user.videoQuota).to.equal(2 * 1024 * 1024);
                expect(user.id).to.be.a('number');
                expect(user.account.displayName).to.equal('new display name');
                expect(user.account.description).to.equal('my super description updated');
                expect(user.noWelcomeModal).to.be.false;
                expect(user.noInstanceConfigWarningModal).to.be.false;
            });
        });
        it('Should be able to update my theme', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const theme of ['background-red', 'default', 'instance-default']) {
                    yield extra_utils_1.updateMyUser({
                        url: server.url,
                        accessToken: accessTokenUser,
                        theme
                    });
                    const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                    const body = res.body;
                    expect(body.theme).to.equal(theme);
                }
            });
        });
        it('Should be able to update my modal preferences', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateMyUser({
                    url: server.url,
                    accessToken: accessTokenUser,
                    noInstanceConfigWarningModal: true,
                    noWelcomeModal: true
                });
                const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const user = res.body;
                expect(user.noWelcomeModal).to.be.true;
                expect(user.noInstanceConfigWarningModal).to.be.true;
            });
        });
    });
    describe('Updating another user', function () {
        it('Should be able to update another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateUser({
                    url: server.url,
                    userId,
                    accessToken,
                    email: 'updated2@example.com',
                    emailVerified: true,
                    videoQuota: 42,
                    role: models_1.UserRole.MODERATOR,
                    adminFlags: 0
                });
                const res = yield extra_utils_1.getUserInformation(server.url, accessToken, userId);
                const user = res.body;
                expect(user.username).to.equal('user_1');
                expect(user.email).to.equal('updated2@example.com');
                expect(user.emailVerified).to.be.true;
                expect(user.nsfwPolicy).to.equal('do_not_list');
                expect(user.videoQuota).to.equal(42);
                expect(user.roleLabel).to.equal('Moderator');
                expect(user.id).to.be.a('number');
                expect(user.adminFlags).to.equal(0);
            });
        });
        it('Should have removed the user token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getMyUserVideoQuotaUsed(server.url, accessTokenUser, 401);
                accessTokenUser = yield extra_utils_1.userLogin(server, user);
            });
        });
        it('Should be able to update another user password', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateUser({
                    url: server.url,
                    userId,
                    accessToken,
                    password: 'password updated'
                });
                yield extra_utils_1.getMyUserVideoQuotaUsed(server.url, accessTokenUser, 401);
                yield extra_utils_1.userLogin(server, user, 400);
                user.password = 'password updated';
                accessTokenUser = yield extra_utils_1.userLogin(server, user);
            });
        });
    });
    describe('Video blacklists', function () {
        it('Should be able to list video blacklist by a moderator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getBlacklistedVideosList({ url: server.url, token: accessTokenUser });
            });
        });
    });
    describe('Remove a user', function () {
        it('Should be able to remove this user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeUser(server.url, userId, accessToken);
            });
        });
        it('Should not be able to login with this user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.userLogin(server, user, 400);
            });
        });
        it('Should not have videos of this user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideosList(server.url);
                expect(res.body.total).to.equal(1);
                const video = res.body.data[0];
                expect(video.account.name).to.equal('root');
            });
        });
    });
    describe('Registering a new user', function () {
        let user15AccessToken;
        it('Should register a new user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const user = { displayName: 'super user 15', username: 'user_15', password: 'my super password' };
                const channel = { name: 'my_user_15_channel', displayName: 'my channel rocks' };
                yield extra_utils_1.registerUserWithChannel({ url: server.url, user, channel });
            });
        });
        it('Should be able to login with this registered user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const user15 = {
                    username: 'user_15',
                    password: 'my super password'
                };
                user15AccessToken = yield extra_utils_1.userLogin(server, user15);
            });
        });
        it('Should have the correct display name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getMyUserInformation(server.url, user15AccessToken);
                const user = res.body;
                expect(user.account.displayName).to.equal('super user 15');
            });
        });
        it('Should have the correct video quota', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getMyUserInformation(server.url, user15AccessToken);
                const user = res.body;
                expect(user.videoQuota).to.equal(5 * 1024 * 1024);
            });
        });
        it('Should have created the channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideoChannel(server.url, 'my_user_15_channel');
                expect(res.body.displayName).to.equal('my channel rocks');
            });
        });
        it('Should remove me', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield extra_utils_1.getUsersList(server.url, server.accessToken);
                    expect(res.body.data.find(u => u.username === 'user_15')).to.not.be.undefined;
                }
                yield extra_utils_1.deleteMe(server.url, user15AccessToken);
                {
                    const res = yield extra_utils_1.getUsersList(server.url, server.accessToken);
                    expect(res.body.data.find(u => u.username === 'user_15')).to.be.undefined;
                }
            });
        });
    });
    describe('User blocking', function () {
        let user16Id;
        let user16AccessToken;
        const user16 = {
            username: 'user_16',
            password: 'my super password'
        };
        it('Should block a user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const resUser = yield extra_utils_1.createUser({
                    url: server.url,
                    accessToken: server.accessToken,
                    username: user16.username,
                    password: user16.password
                });
                user16Id = resUser.body.user.id;
                user16AccessToken = yield extra_utils_1.userLogin(server, user16);
                yield extra_utils_1.getMyUserInformation(server.url, user16AccessToken, 200);
                yield extra_utils_1.blockUser(server.url, user16Id, server.accessToken);
                yield extra_utils_1.getMyUserInformation(server.url, user16AccessToken, 401);
                yield extra_utils_1.userLogin(server, user16, 400);
            });
        });
        it('Should search user by banned status', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield extra_utils_1.getUsersListPaginationAndSort(server.url, server.accessToken, 0, 2, 'createdAt', undefined, true);
                    const users = res.body.data;
                    expect(res.body.total).to.equal(1);
                    expect(users.length).to.equal(1);
                    expect(users[0].username).to.equal(user16.username);
                }
                {
                    const res = yield extra_utils_1.getUsersListPaginationAndSort(server.url, server.accessToken, 0, 2, 'createdAt', undefined, false);
                    const users = res.body.data;
                    expect(res.body.total).to.equal(1);
                    expect(users.length).to.equal(1);
                    expect(users[0].username).to.not.equal(user16.username);
                }
            });
        });
        it('Should unblock a user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.unblockUser(server.url, user16Id, server.accessToken);
                user16AccessToken = yield extra_utils_1.userLogin(server, user16);
                yield extra_utils_1.getMyUserInformation(server.url, user16AccessToken, 200);
            });
        });
    });
    describe('User stats', function () {
        let user17Id;
        let user17AccessToken;
        it('Should report correct initial statistics about a user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const user17 = {
                    username: 'user_17',
                    password: 'my super password'
                };
                const resUser = yield extra_utils_1.createUser({
                    url: server.url,
                    accessToken: server.accessToken,
                    username: user17.username,
                    password: user17.password
                });
                user17Id = resUser.body.user.id;
                user17AccessToken = yield extra_utils_1.userLogin(server, user17);
                const res = yield extra_utils_1.getUserInformation(server.url, server.accessToken, user17Id, true);
                const user = res.body;
                expect(user.videosCount).to.equal(0);
                expect(user.videoCommentsCount).to.equal(0);
                expect(user.abusesCount).to.equal(0);
                expect(user.abusesCreatedCount).to.equal(0);
                expect(user.abusesAcceptedCount).to.equal(0);
            });
        });
        it('Should report correct videos count', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const videoAttributes = {
                    name: 'video to test user stats'
                };
                yield extra_utils_1.uploadVideo(server.url, user17AccessToken, videoAttributes);
                const res1 = yield extra_utils_1.getVideosList(server.url);
                videoId = res1.body.data.find(video => video.name === videoAttributes.name).id;
                const res2 = yield extra_utils_1.getUserInformation(server.url, server.accessToken, user17Id, true);
                const user = res2.body;
                expect(user.videosCount).to.equal(1);
            });
        });
        it('Should report correct video comments for user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const text = 'super comment';
                yield extra_utils_1.addVideoCommentThread(server.url, user17AccessToken, videoId, text);
                const res = yield extra_utils_1.getUserInformation(server.url, server.accessToken, user17Id, true);
                const user = res.body;
                expect(user.videoCommentsCount).to.equal(1);
            });
        });
        it('Should report correct abuses counts', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const reason = 'my super bad reason';
                yield extra_utils_1.reportAbuse({ url: server.url, token: user17AccessToken, videoId, reason });
                const res1 = yield extra_utils_1.getAdminAbusesList({ url: server.url, token: server.accessToken });
                const abuseId = res1.body.data[0].id;
                const res2 = yield extra_utils_1.getUserInformation(server.url, server.accessToken, user17Id, true);
                const user2 = res2.body;
                expect(user2.abusesCount).to.equal(1);
                expect(user2.abusesCreatedCount).to.equal(1);
                const body = { state: 3 };
                yield extra_utils_1.updateAbuse(server.url, server.accessToken, abuseId, body);
                const res3 = yield extra_utils_1.getUserInformation(server.url, server.accessToken, user17Id, true);
                const user3 = res3.body;
                expect(user3.abusesAcceptedCount).to.equal(1);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
