"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const autocannon = require("autocannon");
const extra_utils_1 = require("@shared/extra-utils");
const fs_extra_1 = require("fs-extra");
let server;
let video;
let threadId;
const outfile = process.argv[2];
run()
    .catch(err => console.error(err))
    .finally(() => {
    if (server)
        extra_utils_1.killallServers([server]);
});
function buildAuthorizationHeader() {
    return {
        Authorization: 'Bearer ' + server.accessToken
    };
}
function buildAPHeader() {
    return {
        Accept: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    };
}
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log('Preparing server...');
        yield prepare();
        const tests = [
            {
                title: 'AP - account peertube',
                path: '/accounts/peertube',
                headers: buildAPHeader(),
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"type":');
                }
            },
            {
                title: 'AP - video',
                path: '/videos/watch/' + video.uuid,
                headers: buildAPHeader(),
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"type":"Video"');
                }
            },
            {
                title: 'Misc - webfinger peertube',
                path: '/.well-known/webfinger?resource=acct:peertube@' + server.host,
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"subject":');
                }
            },
            {
                title: 'API - unread notifications',
                path: '/api/v1/users/me/notifications?start=0&count=0&unread=true',
                headers: buildAuthorizationHeader(),
                expecter: (_client, statusCode) => {
                    return statusCode === 200;
                }
            },
            {
                title: 'API - me',
                path: '/api/v1/users/me',
                headers: buildAuthorizationHeader(),
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"id":');
                }
            },
            {
                title: 'API - videos list',
                path: '/api/v1/videos',
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"total":10');
                }
            },
            {
                title: 'API - video get',
                path: '/api/v1/videos/' + video.uuid,
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"id":');
                }
            },
            {
                title: 'API - video captions',
                path: '/api/v1/videos/' + video.uuid + '/captions',
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"total":4');
                }
            },
            {
                title: 'API - video threads',
                path: '/api/v1/videos/' + video.uuid + '/comment-threads',
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"total":10');
                }
            },
            {
                title: 'API - video replies',
                path: '/api/v1/videos/' + video.uuid + '/comment-threads/' + threadId,
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"comment":{');
                }
            },
            {
                title: 'HTML - video watch',
                path: '/videos/watch/' + video.uuid,
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.includes('<title>my super');
                }
            },
            {
                title: 'HTML - video embed',
                path: '/videos/embed/' + video.uuid,
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.includes('embed');
                }
            },
            {
                title: 'HTML - homepage',
                path: '/',
                expecter: (_client, statusCode) => {
                    return statusCode === 200;
                }
            },
            {
                title: 'API - config',
                path: '/api/v1/config',
                expecter: (client, statusCode) => {
                    const body = client.resData[0].body;
                    return statusCode === 200 && body.startsWith('{"instance":');
                }
            }
        ];
        const finalResult = [];
        for (const test of tests) {
            console.log('Running against %s.', test.path);
            const testResult = yield runBenchmark(test);
            Object.assign(testResult, { title: test.title, path: test.path });
            finalResult.push(testResult);
            console.log(autocannon.printResult(testResult));
        }
        if (outfile)
            yield fs_extra_1.writeJson(outfile, finalResult);
    });
}
function runBenchmark(options) {
    const { path, expecter, headers } = options;
    return new Promise((res, rej) => {
        const instance = autocannon({
            url: server.url + path,
            connections: 20,
            headers,
            pipelining: 1,
            duration: 10
        }, (err, result) => {
            if (err)
                return rej(err);
            return res(result);
        });
        instance.on('response', (client, statusCode) => {
            if (expecter(client, statusCode) !== true) {
                console.error('Expected result failed.', { data: client.resData });
                process.exit(-1);
            }
        });
    });
}
function prepare() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        server = yield extra_utils_1.flushAndRunServer(1, {
            rates_limit: {
                api: {
                    max: 5000000
                }
            }
        });
        yield extra_utils_1.setAccessTokensToServers([server]);
        const videoAttributes = {
            name: 'my super video',
            category: 2,
            nsfw: true,
            licence: 6,
            language: 'fr',
            privacy: 1,
            support: 'please give me a coffee',
            description: 'my super description'.repeat(10),
            tags: ['tag1', 'tag2', 'tag3']
        };
        for (let i = 0; i < 10; i++) {
            Object.assign(videoAttributes, { name: 'my super video ' + i });
            yield extra_utils_1.uploadVideo(server.url, server.accessToken, videoAttributes);
        }
        const resVideos = yield extra_utils_1.getVideosList(server.url);
        video = resVideos.body.data.find(v => v.name === 'my super video 1');
        for (let i = 0; i < 10; i++) {
            const text = 'my super first comment';
            const res = yield extra_utils_1.addVideoCommentThread(server.url, server.accessToken, video.id, text);
            threadId = res.body.comment.id;
            const text1 = 'my super answer to thread 1';
            const childCommentRes = yield extra_utils_1.addVideoCommentReply(server.url, server.accessToken, video.id, threadId, text1);
            const childCommentId = childCommentRes.body.comment.id;
            const text2 = 'my super answer to answer of thread 1';
            yield extra_utils_1.addVideoCommentReply(server.url, server.accessToken, video.id, childCommentId, text2);
            const text3 = 'my second answer to thread 1';
            yield extra_utils_1.addVideoCommentReply(server.url, server.accessToken, video.id, threadId, text3);
        }
        for (const caption of ['ar', 'fr', 'en', 'zh']) {
            yield extra_utils_1.createVideoCaption({
                url: server.url,
                accessToken: server.accessToken,
                language: caption,
                videoId: video.id,
                fixture: 'subtitle-good2.vtt'
            });
        }
        return { server, video, threadId };
    });
}
