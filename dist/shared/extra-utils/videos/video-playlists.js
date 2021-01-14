"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doVideosExistInMyPlaylist = exports.checkPlaylistFilesWereRemoved = exports.reorderVideosPlaylist = exports.removeVideoFromPlaylist = exports.updateVideoPlaylistElement = exports.addVideoInPlaylist = exports.deleteVideoPlaylist = exports.updateVideoPlaylist = exports.createVideoPlaylist = exports.getVideoPlaylistWithToken = exports.getVideoPlaylist = exports.getAccountPlaylistsListWithToken = exports.getAccountPlaylistsList = exports.getVideoChannelPlaylistsList = exports.getVideoPlaylistsList = exports.getVideoPlaylistPrivacies = void 0;
const tslib_1 = require("tslib");
const requests_1 = require("../requests/requests");
const lodash_1 = require("lodash");
const videos_1 = require("./videos");
const path_1 = require("path");
const __1 = require("..");
const fs_extra_1 = require("fs-extra");
const chai_1 = require("chai");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getVideoPlaylistsList(url, start, count, sort) {
    const path = '/api/v1/video-playlists';
    const query = {
        start,
        count,
        sort
    };
    return requests_1.makeGetRequest({
        url,
        path,
        query,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getVideoPlaylistsList = getVideoPlaylistsList;
function getVideoChannelPlaylistsList(url, videoChannelName, start, count, sort) {
    const path = '/api/v1/video-channels/' + videoChannelName + '/video-playlists';
    const query = {
        start,
        count,
        sort
    };
    return requests_1.makeGetRequest({
        url,
        path,
        query,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getVideoChannelPlaylistsList = getVideoChannelPlaylistsList;
function getAccountPlaylistsList(url, accountName, start, count, sort, search) {
    const path = '/api/v1/accounts/' + accountName + '/video-playlists';
    const query = {
        start,
        count,
        sort,
        search
    };
    return requests_1.makeGetRequest({
        url,
        path,
        query,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getAccountPlaylistsList = getAccountPlaylistsList;
function getAccountPlaylistsListWithToken(url, token, accountName, start, count, playlistType, sort) {
    const path = '/api/v1/accounts/' + accountName + '/video-playlists';
    const query = {
        start,
        count,
        playlistType,
        sort
    };
    return requests_1.makeGetRequest({
        url,
        token,
        path,
        query,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getAccountPlaylistsListWithToken = getAccountPlaylistsListWithToken;
function getVideoPlaylist(url, playlistId, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/video-playlists/' + playlistId;
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected
    });
}
exports.getVideoPlaylist = getVideoPlaylist;
function getVideoPlaylistWithToken(url, token, playlistId, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/video-playlists/' + playlistId;
    return requests_1.makeGetRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.getVideoPlaylistWithToken = getVideoPlaylistWithToken;
function deleteVideoPlaylist(url, token, playlistId, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/video-playlists/' + playlistId;
    return requests_1.makeDeleteRequest({
        url,
        path,
        token,
        statusCodeExpected
    });
}
exports.deleteVideoPlaylist = deleteVideoPlaylist;
function createVideoPlaylist(options) {
    const path = '/api/v1/video-playlists';
    const fields = lodash_1.omit(options.playlistAttrs, 'thumbnailfile');
    const attaches = options.playlistAttrs.thumbnailfile
        ? { thumbnailfile: options.playlistAttrs.thumbnailfile }
        : {};
    return requests_1.makeUploadRequest({
        method: 'POST',
        url: options.url,
        path,
        token: options.token,
        fields,
        attaches,
        statusCodeExpected: options.expectedStatus || http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.createVideoPlaylist = createVideoPlaylist;
function updateVideoPlaylist(options) {
    const path = '/api/v1/video-playlists/' + options.playlistId;
    const fields = lodash_1.omit(options.playlistAttrs, 'thumbnailfile');
    const attaches = options.playlistAttrs.thumbnailfile
        ? { thumbnailfile: options.playlistAttrs.thumbnailfile }
        : {};
    return requests_1.makeUploadRequest({
        method: 'PUT',
        url: options.url,
        path,
        token: options.token,
        fields,
        attaches,
        statusCodeExpected: options.expectedStatus || http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.updateVideoPlaylist = updateVideoPlaylist;
function addVideoInPlaylist(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        options.elementAttrs.videoId = yield videos_1.videoUUIDToId(options.url, options.elementAttrs.videoId);
        const path = '/api/v1/video-playlists/' + options.playlistId + '/videos';
        return requests_1.makePostBodyRequest({
            url: options.url,
            path,
            token: options.token,
            fields: options.elementAttrs,
            statusCodeExpected: options.expectedStatus || http_error_codes_1.HttpStatusCode.OK_200
        });
    });
}
exports.addVideoInPlaylist = addVideoInPlaylist;
function updateVideoPlaylistElement(options) {
    const path = '/api/v1/video-playlists/' + options.playlistId + '/videos/' + options.playlistElementId;
    return requests_1.makePutBodyRequest({
        url: options.url,
        path,
        token: options.token,
        fields: options.elementAttrs,
        statusCodeExpected: options.expectedStatus || http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.updateVideoPlaylistElement = updateVideoPlaylistElement;
function removeVideoFromPlaylist(options) {
    const path = '/api/v1/video-playlists/' + options.playlistId + '/videos/' + options.playlistElementId;
    return requests_1.makeDeleteRequest({
        url: options.url,
        path,
        token: options.token,
        statusCodeExpected: options.expectedStatus || http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.removeVideoFromPlaylist = removeVideoFromPlaylist;
function reorderVideosPlaylist(options) {
    const path = '/api/v1/video-playlists/' + options.playlistId + '/videos/reorder';
    return requests_1.makePostBodyRequest({
        url: options.url,
        path,
        token: options.token,
        fields: options.elementAttrs,
        statusCodeExpected: options.expectedStatus || http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.reorderVideosPlaylist = reorderVideosPlaylist;
function checkPlaylistFilesWereRemoved(playlistUUID, internalServerNumber, directories = ['thumbnails']) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const testDirectory = 'test' + internalServerNumber;
        for (const directory of directories) {
            const directoryPath = path_1.join(__1.root(), testDirectory, directory);
            const files = yield fs_extra_1.readdir(directoryPath);
            for (const file of files) {
                chai_1.expect(file).to.not.contain(playlistUUID);
            }
        }
    });
}
exports.checkPlaylistFilesWereRemoved = checkPlaylistFilesWereRemoved;
function getVideoPlaylistPrivacies(url) {
    const path = '/api/v1/video-playlists/privacies';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getVideoPlaylistPrivacies = getVideoPlaylistPrivacies;
function doVideosExistInMyPlaylist(url, token, videoIds) {
    const path = '/api/v1/users/me/video-playlists/videos-exist';
    return requests_1.makeGetRequest({
        url,
        token,
        path,
        query: { videoIds },
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.doVideosExistInMyPlaylist = doVideosExistInMyPlaylist;
