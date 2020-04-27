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
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../shared/extra-utils");
const libxmljs = require("libxmljs");
const video_comments_1 = require("../../../shared/extra-utils/videos/video-comments");
const jobs_1 = require("../../../shared/extra-utils/server/jobs");
chai.use(require('chai-xml'));
chai.use(require('chai-json-schema'));
chai.config.includeStack = true;
const expect = chai.expect;
describe('Test syndication feeds', () => {
    let servers = [];
    let userAccessToken;
    let rootAccountId;
    let rootChannelId;
    let userAccountId;
    let userChannelId;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            {
                const res = yield extra_utils_1.getMyUserInformation(servers[0].url, servers[0].accessToken);
                const user = res.body;
                rootAccountId = user.account.id;
                rootChannelId = user.videoChannels[0].id;
            }
            {
                const attr = { username: 'john', password: 'password' };
                yield extra_utils_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: attr.username, password: attr.password });
                userAccessToken = yield extra_utils_1.userLogin(servers[0], attr);
                const res = yield extra_utils_1.getMyUserInformation(servers[0].url, userAccessToken);
                const user = res.body;
                userAccountId = user.account.id;
                userChannelId = user.videoChannels[0].id;
            }
            {
                yield extra_utils_1.uploadVideo(servers[0].url, userAccessToken, { name: 'user video' });
            }
            {
                const videoAttributes = {
                    name: 'my super name for server 1',
                    description: 'my super description for server 1',
                    fixture: 'video_short.webm'
                };
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
                const videoId = res.body.video.id;
                yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoId, 'super comment 1');
                yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoId, 'super comment 2');
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    describe('All feed', function () {
        it('Should be well formed XML (covers RSS 2.0 and ATOM 1.0 endpoints)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                for (const feed of ['video-comments', 'videos']) {
                    const rss = yield extra_utils_1.getXMLfeed(servers[0].url, feed);
                    expect(rss.text).xml.to.be.valid();
                    const atom = yield extra_utils_1.getXMLfeed(servers[0].url, feed, 'atom');
                    expect(atom.text).xml.to.be.valid();
                }
            });
        });
        it('Should be well formed JSON (covers JSON feed 1.0 endpoint)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                for (const feed of ['video-comments', 'videos']) {
                    const json = yield extra_utils_1.getJSONfeed(servers[0].url, feed);
                    expect(JSON.parse(json.text)).to.be.jsonSchema({ 'type': 'object' });
                }
            });
        });
    });
    describe('Videos feed', function () {
        it('Should contain a valid enclosure (covers RSS 2.0 endpoint)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const rss = yield extra_utils_1.getXMLfeed(server.url, 'videos');
                    const xmlDoc = libxmljs.parseXmlString(rss.text);
                    const xmlEnclosure = xmlDoc.get('/rss/channel/item/enclosure');
                    expect(xmlEnclosure).to.exist;
                    expect(xmlEnclosure.attr('type').value()).to.be.equal('application/x-bittorrent');
                    expect(xmlEnclosure.attr('length').value()).to.be.equal('218910');
                    expect(xmlEnclosure.attr('url').value()).to.contain('720.torrent');
                }
            });
        });
        it('Should contain a valid \'attachments\' object (covers JSON feed 1.0 endpoint)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const json = yield extra_utils_1.getJSONfeed(server.url, 'videos');
                    const jsonObj = JSON.parse(json.text);
                    expect(jsonObj.items.length).to.be.equal(2);
                    expect(jsonObj.items[0].attachments).to.exist;
                    expect(jsonObj.items[0].attachments.length).to.be.eq(1);
                    expect(jsonObj.items[0].attachments[0].mime_type).to.be.eq('application/x-bittorrent');
                    expect(jsonObj.items[0].attachments[0].size_in_bytes).to.be.eq(218910);
                    expect(jsonObj.items[0].attachments[0].url).to.contain('720.torrent');
                }
            });
        });
        it('Should filter by account', function () {
            return __awaiter(this, void 0, void 0, function* () {
                {
                    const json = yield extra_utils_1.getJSONfeed(servers[0].url, 'videos', { accountId: rootAccountId });
                    const jsonObj = JSON.parse(json.text);
                    expect(jsonObj.items.length).to.be.equal(1);
                    expect(jsonObj.items[0].title).to.equal('my super name for server 1');
                    expect(jsonObj.items[0].author.name).to.equal('root');
                }
                {
                    const json = yield extra_utils_1.getJSONfeed(servers[0].url, 'videos', { accountId: userAccountId });
                    const jsonObj = JSON.parse(json.text);
                    expect(jsonObj.items.length).to.be.equal(1);
                    expect(jsonObj.items[0].title).to.equal('user video');
                    expect(jsonObj.items[0].author.name).to.equal('john');
                }
                for (const server of servers) {
                    {
                        const json = yield extra_utils_1.getJSONfeed(server.url, 'videos', { accountName: 'root@localhost:' + servers[0].port });
                        const jsonObj = JSON.parse(json.text);
                        expect(jsonObj.items.length).to.be.equal(1);
                        expect(jsonObj.items[0].title).to.equal('my super name for server 1');
                    }
                    {
                        const json = yield extra_utils_1.getJSONfeed(server.url, 'videos', { accountName: 'john@localhost:' + servers[0].port });
                        const jsonObj = JSON.parse(json.text);
                        expect(jsonObj.items.length).to.be.equal(1);
                        expect(jsonObj.items[0].title).to.equal('user video');
                    }
                }
            });
        });
        it('Should filter by video channel', function () {
            return __awaiter(this, void 0, void 0, function* () {
                {
                    const json = yield extra_utils_1.getJSONfeed(servers[0].url, 'videos', { videoChannelId: rootChannelId });
                    const jsonObj = JSON.parse(json.text);
                    expect(jsonObj.items.length).to.be.equal(1);
                    expect(jsonObj.items[0].title).to.equal('my super name for server 1');
                    expect(jsonObj.items[0].author.name).to.equal('root');
                }
                {
                    const json = yield extra_utils_1.getJSONfeed(servers[0].url, 'videos', { videoChannelId: userChannelId });
                    const jsonObj = JSON.parse(json.text);
                    expect(jsonObj.items.length).to.be.equal(1);
                    expect(jsonObj.items[0].title).to.equal('user video');
                    expect(jsonObj.items[0].author.name).to.equal('john');
                }
                for (const server of servers) {
                    {
                        const json = yield extra_utils_1.getJSONfeed(server.url, 'videos', { videoChannelName: 'root_channel@localhost:' + servers[0].port });
                        const jsonObj = JSON.parse(json.text);
                        expect(jsonObj.items.length).to.be.equal(1);
                        expect(jsonObj.items[0].title).to.equal('my super name for server 1');
                    }
                    {
                        const json = yield extra_utils_1.getJSONfeed(server.url, 'videos', { videoChannelName: 'john_channel@localhost:' + servers[0].port });
                        const jsonObj = JSON.parse(json.text);
                        expect(jsonObj.items.length).to.be.equal(1);
                        expect(jsonObj.items[0].title).to.equal('user video');
                    }
                }
            });
        });
    });
    describe('Video comments feed', function () {
        it('Should contain valid comments (covers JSON feed 1.0 endpoint)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const json = yield extra_utils_1.getJSONfeed(server.url, 'video-comments');
                    const jsonObj = JSON.parse(json.text);
                    expect(jsonObj.items.length).to.be.equal(2);
                    expect(jsonObj.items[0].html_content).to.equal('super comment 2');
                    expect(jsonObj.items[1].html_content).to.equal('super comment 1');
                }
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
