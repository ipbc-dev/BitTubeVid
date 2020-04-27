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
const requests_1 = require("../requests/requests");
const lodash_1 = require("lodash");
const videos_1 = require("./videos");
const path_1 = require("path");
const __1 = require("..");
const fs_extra_1 = require("fs-extra");
const chai_1 = require("chai");
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
        statusCodeExpected: 200
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
        statusCodeExpected: 200
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
        statusCodeExpected: 200
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
        statusCodeExpected: 200
    });
}
exports.getAccountPlaylistsListWithToken = getAccountPlaylistsListWithToken;
function getVideoPlaylist(url, playlistId, statusCodeExpected = 200) {
    const path = '/api/v1/video-playlists/' + playlistId;
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected
    });
}
exports.getVideoPlaylist = getVideoPlaylist;
function getVideoPlaylistWithToken(url, token, playlistId, statusCodeExpected = 200) {
    const path = '/api/v1/video-playlists/' + playlistId;
    return requests_1.makeGetRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.getVideoPlaylistWithToken = getVideoPlaylistWithToken;
function deleteVideoPlaylist(url, token, playlistId, statusCodeExpected = 204) {
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
        statusCodeExpected: options.expectedStatus || 200
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
        statusCodeExpected: options.expectedStatus || 204
    });
}
exports.updateVideoPlaylist = updateVideoPlaylist;
function addVideoInPlaylist(options) {
    return __awaiter(this, void 0, void 0, function* () {
        options.elementAttrs.videoId = yield videos_1.videoUUIDToId(options.url, options.elementAttrs.videoId);
        const path = '/api/v1/video-playlists/' + options.playlistId + '/videos';
        return requests_1.makePostBodyRequest({
            url: options.url,
            path,
            token: options.token,
            fields: options.elementAttrs,
            statusCodeExpected: options.expectedStatus || 200
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
        statusCodeExpected: options.expectedStatus || 204
    });
}
exports.updateVideoPlaylistElement = updateVideoPlaylistElement;
function removeVideoFromPlaylist(options) {
    const path = '/api/v1/video-playlists/' + options.playlistId + '/videos/' + options.playlistElementId;
    return requests_1.makeDeleteRequest({
        url: options.url,
        path,
        token: options.token,
        statusCodeExpected: options.expectedStatus || 204
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
        statusCodeExpected: options.expectedStatus || 204
    });
}
exports.reorderVideosPlaylist = reorderVideosPlaylist;
function checkPlaylistFilesWereRemoved(playlistUUID, internalServerNumber, directories = ['thumbnails']) {
    return __awaiter(this, void 0, void 0, function* () {
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
        statusCodeExpected: 200
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
        statusCodeExpected: 200
    });
}
exports.doVideosExistInMyPlaylist = doVideosExistInMyPlaylist;
