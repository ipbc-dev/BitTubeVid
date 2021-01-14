"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
describe('Test video playlists API validator', function () {
    let server;
    let userAccessToken;
    let playlistUUID;
    let privatePlaylistUUID;
    let watchLaterPlaylistId;
    let videoId;
    let playlistElementId;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.setDefaultVideoChannel([server]);
            userAccessToken = yield extra_utils_1.generateUserAccessToken(server, 'user1');
            videoId = (yield extra_utils_1.uploadVideoAndGetId({ server, videoName: 'video 1' })).id;
            {
                const res = yield extra_utils_1.getAccountPlaylistsListWithToken(server.url, server.accessToken, 'root', 0, 5, 2);
                watchLaterPlaylistId = res.body.data[0].id;
            }
            {
                const res = yield extra_utils_1.createVideoPlaylist({
                    url: server.url,
                    token: server.accessToken,
                    playlistAttrs: {
                        displayName: 'super playlist',
                        privacy: 1,
                        videoChannelId: server.videoChannel.id
                    }
                });
                playlistUUID = res.body.videoPlaylist.uuid;
            }
            {
                const res = yield extra_utils_1.createVideoPlaylist({
                    url: server.url,
                    token: server.accessToken,
                    playlistAttrs: {
                        displayName: 'private',
                        privacy: 3
                    }
                });
                privatePlaylistUUID = res.body.videoPlaylist.uuid;
            }
        });
    });
    describe('When listing playlists', function () {
        const globalPath = '/api/v1/video-playlists';
        const accountPath = '/api/v1/accounts/root/video-playlists';
        const videoChannelPath = '/api/v1/video-channels/root_channel/video-playlists';
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, globalPath, server.accessToken);
                yield check_api_params_1.checkBadStartPagination(server.url, accountPath, server.accessToken);
                yield check_api_params_1.checkBadStartPagination(server.url, videoChannelPath, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, globalPath, server.accessToken);
                yield check_api_params_1.checkBadCountPagination(server.url, accountPath, server.accessToken);
                yield check_api_params_1.checkBadCountPagination(server.url, videoChannelPath, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, globalPath, server.accessToken);
                yield check_api_params_1.checkBadSortPagination(server.url, accountPath, server.accessToken);
                yield check_api_params_1.checkBadSortPagination(server.url, videoChannelPath, server.accessToken);
            });
        });
        it('Should fail with a bad playlist type', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path: globalPath, query: { playlistType: 3 } });
                yield extra_utils_1.makeGetRequest({ url: server.url, path: accountPath, query: { playlistType: 3 } });
                yield extra_utils_1.makeGetRequest({ url: server.url, path: videoChannelPath, query: { playlistType: 3 } });
            });
        });
        it('Should fail with a bad account parameter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const accountPath = '/api/v1/accounts/root2/video-playlists';
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: accountPath,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404,
                    token: server.accessToken
                });
            });
        });
        it('Should fail with a bad video channel parameter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const accountPath = '/api/v1/video-channels/bad_channel/video-playlists';
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: accountPath,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404,
                    token: server.accessToken
                });
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path: globalPath, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200, token: server.accessToken });
                yield extra_utils_1.makeGetRequest({ url: server.url, path: accountPath, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200, token: server.accessToken });
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: videoChannelPath,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200,
                    token: server.accessToken
                });
            });
        });
    });
    describe('When listing videos of a playlist', function () {
        const path = '/api/v1/video-playlists/';
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path + playlistUUID + '/videos', server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path + playlistUUID + '/videos', server.accessToken);
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path: path + playlistUUID + '/videos', statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200 });
            });
        });
    });
    describe('When getting a video playlist', function () {
        it('Should fail with a bad id or uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideoPlaylist(server.url, 'toto', http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            });
        });
        it('Should fail with an unknown playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideoPlaylist(server.url, 42, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
            });
        });
        it('Should fail to get an unlisted playlist with the number id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.createVideoPlaylist({
                    url: server.url,
                    token: server.accessToken,
                    playlistAttrs: {
                        displayName: 'super playlist',
                        privacy: 2
                    }
                });
                const playlist = res.body.videoPlaylist;
                yield extra_utils_1.getVideoPlaylist(server.url, playlist.id, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                yield extra_utils_1.getVideoPlaylist(server.url, playlist.uuid, http_error_codes_1.HttpStatusCode.OK_200);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideoPlaylist(server.url, playlistUUID, http_error_codes_1.HttpStatusCode.OK_200);
            });
        });
    });
    describe('When creating/updating a video playlist', function () {
        const getBase = (playlistAttrs = {}, wrapper = {}) => {
            return Object.assign({
                expectedStatus: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400,
                url: server.url,
                token: server.accessToken,
                playlistAttrs: Object.assign({
                    displayName: 'display name',
                    privacy: 2,
                    thumbnailfile: 'thumbnail.jpg',
                    videoChannelId: server.videoChannel.id
                }, playlistAttrs)
            }, wrapper);
        };
        const getUpdate = (params, playlistId) => {
            return extra_utils_1.immutableAssign(params, { playlistId: playlistId });
        };
        it('Should fail with an unauthenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { token: null, expectedStatus: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
                yield extra_utils_1.createVideoPlaylist(params);
                yield extra_utils_1.updateVideoPlaylist(getUpdate(params, playlistUUID));
            });
        });
        it('Should fail without displayName', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ displayName: undefined });
                yield extra_utils_1.createVideoPlaylist(params);
            });
        });
        it('Should fail with an incorrect display name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ displayName: 's'.repeat(300) });
                yield extra_utils_1.createVideoPlaylist(params);
                yield extra_utils_1.updateVideoPlaylist(getUpdate(params, playlistUUID));
            });
        });
        it('Should fail with an incorrect description', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ description: 't' });
                yield extra_utils_1.createVideoPlaylist(params);
                yield extra_utils_1.updateVideoPlaylist(getUpdate(params, playlistUUID));
            });
        });
        it('Should fail with an incorrect privacy', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ privacy: 45 });
                yield extra_utils_1.createVideoPlaylist(params);
                yield extra_utils_1.updateVideoPlaylist(getUpdate(params, playlistUUID));
            });
        });
        it('Should fail with an unknown video channel id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ videoChannelId: 42 }, { expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                yield extra_utils_1.createVideoPlaylist(params);
                yield extra_utils_1.updateVideoPlaylist(getUpdate(params, playlistUUID));
            });
        });
        it('Should fail with an incorrect thumbnail file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ thumbnailfile: 'avatar.png' });
                yield extra_utils_1.createVideoPlaylist(params);
                yield extra_utils_1.updateVideoPlaylist(getUpdate(params, playlistUUID));
            });
        });
        it('Should fail to set "public" a playlist not assigned to a channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ privacy: 1, videoChannelId: undefined });
                const params2 = getBase({ privacy: 1, videoChannelId: 'null' });
                const params3 = getBase({ privacy: undefined, videoChannelId: 'null' });
                yield extra_utils_1.createVideoPlaylist(params);
                yield extra_utils_1.createVideoPlaylist(params2);
                yield extra_utils_1.updateVideoPlaylist(getUpdate(params, privatePlaylistUUID));
                yield extra_utils_1.updateVideoPlaylist(getUpdate(params2, playlistUUID));
                yield extra_utils_1.updateVideoPlaylist(getUpdate(params3, playlistUUID));
            });
        });
        it('Should fail with an unknown playlist to update', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateVideoPlaylist(getUpdate(getBase({}, { expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 }), 42));
            });
        });
        it('Should fail to update a playlist of another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateVideoPlaylist(getUpdate(getBase({}, { token: userAccessToken, expectedStatus: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 }), playlistUUID));
            });
        });
        it('Should fail to update the watch later playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateVideoPlaylist(getUpdate(getBase({}, { expectedStatus: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400 }), watchLaterPlaylistId));
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({}, { expectedStatus: http_error_codes_1.HttpStatusCode.OK_200 });
                    yield extra_utils_1.createVideoPlaylist(params);
                }
                {
                    const params = getBase({}, { expectedStatus: http_error_codes_1.HttpStatusCode.NO_CONTENT_204 });
                    yield extra_utils_1.updateVideoPlaylist(getUpdate(params, playlistUUID));
                }
            });
        });
    });
    describe('When adding an element in a playlist', function () {
        const getBase = (elementAttrs = {}, wrapper = {}) => {
            return Object.assign({
                expectedStatus: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400,
                url: server.url,
                token: server.accessToken,
                playlistId: playlistUUID,
                elementAttrs: Object.assign({
                    videoId,
                    startTimestamp: 2,
                    stopTimestamp: 3
                }, elementAttrs)
            }, wrapper);
        };
        it('Should fail with an unauthenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { token: null, expectedStatus: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
                yield extra_utils_1.addVideoInPlaylist(params);
            });
        });
        it('Should fail with the playlist of another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { token: userAccessToken, expectedStatus: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
                yield extra_utils_1.addVideoInPlaylist(params);
            });
        });
        it('Should fail with an unknown or incorrect playlist id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({}, { playlistId: 'toto' });
                    yield extra_utils_1.addVideoInPlaylist(params);
                }
                {
                    const params = getBase({}, { playlistId: 42, expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                    yield extra_utils_1.addVideoInPlaylist(params);
                }
            });
        });
        it('Should fail with an unknown or incorrect video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ videoId: 42 }, { expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                yield extra_utils_1.addVideoInPlaylist(params);
            });
        });
        it('Should fail with a bad start/stop timestamp', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({ startTimestamp: -42 });
                    yield extra_utils_1.addVideoInPlaylist(params);
                }
                {
                    const params = getBase({ stopTimestamp: 'toto' });
                    yield extra_utils_1.addVideoInPlaylist(params);
                }
            });
        });
        it('Succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { expectedStatus: http_error_codes_1.HttpStatusCode.OK_200 });
                const res = yield extra_utils_1.addVideoInPlaylist(params);
                playlistElementId = res.body.videoPlaylistElement.id;
            });
        });
    });
    describe('When updating an element in a playlist', function () {
        const getBase = (elementAttrs = {}, wrapper = {}) => {
            return Object.assign({
                url: server.url,
                token: server.accessToken,
                elementAttrs: Object.assign({
                    startTimestamp: 1,
                    stopTimestamp: 2
                }, elementAttrs),
                playlistElementId,
                playlistId: playlistUUID,
                expectedStatus: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
            }, wrapper);
        };
        it('Should fail with an unauthenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { token: null, expectedStatus: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
                yield extra_utils_1.updateVideoPlaylistElement(params);
            });
        });
        it('Should fail with the playlist of another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { token: userAccessToken, expectedStatus: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
                yield extra_utils_1.updateVideoPlaylistElement(params);
            });
        });
        it('Should fail with an unknown or incorrect playlist id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({}, { playlistId: 'toto' });
                    yield extra_utils_1.updateVideoPlaylistElement(params);
                }
                {
                    const params = getBase({}, { playlistId: 42, expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                    yield extra_utils_1.updateVideoPlaylistElement(params);
                }
            });
        });
        it('Should fail with an unknown or incorrect playlistElement id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({}, { playlistElementId: 'toto' });
                    yield extra_utils_1.updateVideoPlaylistElement(params);
                }
                {
                    const params = getBase({}, { playlistElementId: 42, expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                    yield extra_utils_1.updateVideoPlaylistElement(params);
                }
            });
        });
        it('Should fail with a bad start/stop timestamp', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({ startTimestamp: 'toto' });
                    yield extra_utils_1.updateVideoPlaylistElement(params);
                }
                {
                    const params = getBase({ stopTimestamp: -42 });
                    yield extra_utils_1.updateVideoPlaylistElement(params);
                }
            });
        });
        it('Should fail with an unknown element', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { playlistElementId: 888, expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                yield extra_utils_1.updateVideoPlaylistElement(params);
            });
        });
        it('Succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { expectedStatus: http_error_codes_1.HttpStatusCode.NO_CONTENT_204 });
                yield extra_utils_1.updateVideoPlaylistElement(params);
            });
        });
    });
    describe('When reordering elements of a playlist', function () {
        let videoId3;
        let videoId4;
        const getBase = (elementAttrs = {}, wrapper = {}) => {
            return Object.assign({
                url: server.url,
                token: server.accessToken,
                playlistId: playlistUUID,
                elementAttrs: Object.assign({
                    startPosition: 1,
                    insertAfterPosition: 2,
                    reorderLength: 3
                }, elementAttrs),
                expectedStatus: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
            }, wrapper);
        };
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                videoId3 = (yield extra_utils_1.uploadVideoAndGetId({ server, videoName: 'video 3' })).id;
                videoId4 = (yield extra_utils_1.uploadVideoAndGetId({ server, videoName: 'video 4' })).id;
                for (const id of [videoId3, videoId4]) {
                    yield extra_utils_1.addVideoInPlaylist({
                        url: server.url,
                        token: server.accessToken,
                        playlistId: playlistUUID,
                        elementAttrs: { videoId: id }
                    });
                }
            });
        });
        it('Should fail with an unauthenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { token: null, expectedStatus: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
                yield extra_utils_1.reorderVideosPlaylist(params);
            });
        });
        it('Should fail with the playlist of another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { token: userAccessToken, expectedStatus: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
                yield extra_utils_1.reorderVideosPlaylist(params);
            });
        });
        it('Should fail with an invalid playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({}, { playlistId: 'toto' });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
                {
                    const params = getBase({}, { playlistId: 42, expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
            });
        });
        it('Should fail with an invalid start position', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({ startPosition: -1 });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
                {
                    const params = getBase({ startPosition: 'toto' });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
                {
                    const params = getBase({ startPosition: 42 });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
            });
        });
        it('Should fail with an invalid insert after position', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({ insertAfterPosition: 'toto' });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
                {
                    const params = getBase({ insertAfterPosition: -2 });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
                {
                    const params = getBase({ insertAfterPosition: 42 });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
            });
        });
        it('Should fail with an invalid reorder length', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({ reorderLength: 'toto' });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
                {
                    const params = getBase({ reorderLength: -2 });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
                {
                    const params = getBase({ reorderLength: 42 });
                    yield extra_utils_1.reorderVideosPlaylist(params);
                }
            });
        });
        it('Succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({}, { expectedStatus: http_error_codes_1.HttpStatusCode.NO_CONTENT_204 });
                yield extra_utils_1.reorderVideosPlaylist(params);
            });
        });
    });
    describe('When checking exists in playlist endpoint', function () {
        const path = '/api/v1/users/me/video-playlists/videos-exist';
        it('Should fail with an unauthenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    query: { videoIds: [1, 2] },
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401
                });
            });
        });
        it('Should fail with invalid video ids', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    token: server.accessToken,
                    path,
                    query: { videoIds: 'toto' }
                });
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    token: server.accessToken,
                    path,
                    query: { videoIds: ['toto'] }
                });
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    token: server.accessToken,
                    path,
                    query: { videoIds: [1, 'toto'] }
                });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    token: server.accessToken,
                    path,
                    query: { videoIds: [1, 2] },
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
            });
        });
    });
    describe('When deleting an element in a playlist', function () {
        const getBase = (wrapper = {}) => {
            return Object.assign({
                url: server.url,
                token: server.accessToken,
                playlistElementId,
                playlistId: playlistUUID,
                expectedStatus: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
            }, wrapper);
        };
        it('Should fail with an unauthenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ token: null, expectedStatus: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
                yield extra_utils_1.removeVideoFromPlaylist(params);
            });
        });
        it('Should fail with the playlist of another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ token: userAccessToken, expectedStatus: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
                yield extra_utils_1.removeVideoFromPlaylist(params);
            });
        });
        it('Should fail with an unknown or incorrect playlist id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({ playlistId: 'toto' });
                    yield extra_utils_1.removeVideoFromPlaylist(params);
                }
                {
                    const params = getBase({ playlistId: 42, expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                    yield extra_utils_1.removeVideoFromPlaylist(params);
                }
            });
        });
        it('Should fail with an unknown or incorrect video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const params = getBase({ playlistElementId: 'toto' });
                    yield extra_utils_1.removeVideoFromPlaylist(params);
                }
                {
                    const params = getBase({ playlistElementId: 42, expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                    yield extra_utils_1.removeVideoFromPlaylist(params);
                }
            });
        });
        it('Should fail with an unknown element', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ playlistElementId: 888, expectedStatus: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
                yield extra_utils_1.removeVideoFromPlaylist(params);
            });
        });
        it('Succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const params = getBase({ expectedStatus: http_error_codes_1.HttpStatusCode.NO_CONTENT_204 });
                yield extra_utils_1.removeVideoFromPlaylist(params);
            });
        });
    });
    describe('When deleting a playlist', function () {
        it('Should fail with an unknown playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoPlaylist(server.url, server.accessToken, 42, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
            });
        });
        it('Should fail with a playlist of another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoPlaylist(server.url, userAccessToken, playlistUUID, http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should fail with the watch later playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoPlaylist(server.url, server.accessToken, watchLaterPlaylistId, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoPlaylist(server.url, server.accessToken, playlistUUID);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
