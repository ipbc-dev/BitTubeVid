"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai_1 = require("chai");
const extra_utils_1 = require("../../../shared/extra-utils");
const video_imports_1 = require("../../../shared/extra-utils/videos/video-imports");
describe('Test CLI wrapper', function () {
    let server;
    let userAccessToken;
    const cmd = 'node ./dist/server/tools/peertube.js';
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: 'user_1', password: 'super_password' });
            userAccessToken = yield extra_utils_1.userLogin(server, { username: 'user_1', password: 'super_password' });
            {
                const args = { name: 'user_channel', displayName: 'User channel', support: 'super support text' };
                yield extra_utils_1.addVideoChannel(server.url, userAccessToken, args);
            }
        });
    });
    describe('Authentication and instance selection', function () {
        it('Should display no selected instance', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                const stdout = yield extra_utils_1.execCLI(`${env} ${cmd} --help`);
                chai_1.expect(stdout).to.contain('no instance selected');
            });
        });
        it('Should add a user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                yield extra_utils_1.execCLI(`${env} ${cmd} auth add -u ${server.url} -U user_1 -p super_password`);
            });
        });
        it('Should default to this user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                const stdout = yield extra_utils_1.execCLI(`${env} ${cmd} --help`);
                chai_1.expect(stdout).to.contain(`instance ${server.url} selected`);
            });
        });
        it('Should remember the user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                const stdout = yield extra_utils_1.execCLI(`${env} ${cmd} auth list`);
                chai_1.expect(stdout).to.contain(server.url);
            });
        });
    });
    describe('Video upload/import', function () {
        it('Should upload a video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                const fixture = extra_utils_1.buildAbsoluteFixturePath('60fps_720p_small.mp4');
                const params = `-f ${fixture} --video-name 'test upload' --channel-name user_channel --support 'support_text'`;
                yield extra_utils_1.execCLI(`${env} ${cmd} upload ${params}`);
            });
        });
        it('Should have the video uploaded', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideosList(server.url);
                chai_1.expect(res.body.total).to.equal(1);
                const videos = res.body.data;
                const video = (yield extra_utils_1.getVideo(server.url, videos[0].uuid)).body;
                chai_1.expect(video.name).to.equal('test upload');
                chai_1.expect(video.support).to.equal('support_text');
                chai_1.expect(video.channel.name).to.equal('user_channel');
            });
        });
        it('Should import a video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                const params = `--target-url ${video_imports_1.getYoutubeVideoUrl()} --channel-name user_channel`;
                yield extra_utils_1.execCLI(`${env} ${cmd} import ${params}`);
            });
        });
        it('Should have imported the video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                yield extra_utils_1.waitJobs([server]);
                const res = yield extra_utils_1.getVideosList(server.url);
                chai_1.expect(res.body.total).to.equal(2);
                const videos = res.body.data;
                const video = videos.find(v => v.name === 'small video - youtube');
                chai_1.expect(video).to.not.be.undefined;
                const videoDetails = (yield extra_utils_1.getVideo(server.url, video.id)).body;
                chai_1.expect(videoDetails.channel.name).to.equal('user_channel');
                chai_1.expect(videoDetails.support).to.equal('super support text');
                chai_1.expect(videoDetails.nsfw).to.be.false;
                yield extra_utils_1.removeVideo(server.url, userAccessToken, video.id);
            });
        });
        it('Should import and override some imported attributes', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                const params = `--target-url ${video_imports_1.getYoutubeVideoUrl()} --channel-name user_channel --video-name toto --nsfw --support support`;
                yield extra_utils_1.execCLI(`${env} ${cmd} import ${params}`);
                yield extra_utils_1.waitJobs([server]);
                {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    chai_1.expect(res.body.total).to.equal(2);
                    const videos = res.body.data;
                    const video = videos.find(v => v.name === 'toto');
                    chai_1.expect(video).to.not.be.undefined;
                    const videoDetails = (yield extra_utils_1.getVideo(server.url, video.id)).body;
                    chai_1.expect(videoDetails.channel.name).to.equal('user_channel');
                    chai_1.expect(videoDetails.support).to.equal('support');
                    chai_1.expect(videoDetails.nsfw).to.be.true;
                    chai_1.expect(videoDetails.commentsEnabled).to.be.true;
                }
            });
        });
    });
    describe('Admin auth', function () {
        it('Should remove the auth user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const env = extra_utils_1.getEnvCli(server);
                yield extra_utils_1.execCLI(`${env} ${cmd} auth del ${server.url}`);
                const stdout = yield extra_utils_1.execCLI(`${env} ${cmd} --help`);
                chai_1.expect(stdout).to.contain('no instance selected');
            });
        });
        it('Should add the admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const env = extra_utils_1.getEnvCli(server);
                yield extra_utils_1.execCLI(`${env} ${cmd} auth add -u ${server.url} -U root -p test${server.internalServerNumber}`);
            });
        });
    });
    describe('Manage plugins', function () {
        it('Should install a plugin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                yield extra_utils_1.execCLI(`${env} ${cmd} plugins install --npm-name peertube-plugin-hello-world`);
            });
        });
        it('Should list installed plugins', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const env = extra_utils_1.getEnvCli(server);
                const res = yield extra_utils_1.execCLI(`${env} ${cmd} plugins list`);
                chai_1.expect(res).to.contain('peertube-plugin-hello-world');
            });
        });
        it('Should uninstall the plugin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const env = extra_utils_1.getEnvCli(server);
                const res = yield extra_utils_1.execCLI(`${env} ${cmd} plugins uninstall --npm-name peertube-plugin-hello-world`);
                chai_1.expect(res).to.not.contain('peertube-plugin-hello-world');
            });
        });
    });
    describe('Manage video redundancies', function () {
        let anotherServer;
        let video1Server2;
        let servers;
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                anotherServer = yield extra_utils_1.flushAndRunServer(2);
                yield extra_utils_1.setAccessTokensToServers([anotherServer]);
                yield extra_utils_1.doubleFollow(server, anotherServer);
                servers = [server, anotherServer];
                yield extra_utils_1.waitJobs(servers);
                const uuid = (yield extra_utils_1.uploadVideoAndGetId({ server: anotherServer, videoName: 'super video' })).uuid;
                yield extra_utils_1.waitJobs(servers);
                video1Server2 = yield extra_utils_1.getLocalIdByUUID(server.url, uuid);
            });
        });
        it('Should add a redundancy', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                const params = `add --video ${video1Server2}`;
                yield extra_utils_1.execCLI(`${env} ${cmd} redundancy ${params}`);
                yield extra_utils_1.waitJobs(servers);
            });
        });
        it('Should list redundancies', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                {
                    const env = extra_utils_1.getEnvCli(server);
                    const params = 'list-my-redundancies';
                    const stdout = yield extra_utils_1.execCLI(`${env} ${cmd} redundancy ${params}`);
                    chai_1.expect(stdout).to.contain('super video');
                    chai_1.expect(stdout).to.contain(`localhost:${server.port}`);
                }
            });
        });
        it('Should remove a redundancy', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const env = extra_utils_1.getEnvCli(server);
                const params = `remove --video ${video1Server2}`;
                yield extra_utils_1.execCLI(`${env} ${cmd} redundancy ${params}`);
                yield extra_utils_1.waitJobs(servers);
                {
                    const env = extra_utils_1.getEnvCli(server);
                    const params = 'list-my-redundancies';
                    const stdout = yield extra_utils_1.execCLI(`${env} ${cmd} redundancy ${params}`);
                    chai_1.expect(stdout).to.not.contain('super video');
                }
            });
        });
        after(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.cleanupTests([anotherServer]);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
