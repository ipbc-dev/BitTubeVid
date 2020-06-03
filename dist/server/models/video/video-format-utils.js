"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const video_1 = require("./video");
const constants_1 = require("../../initializers/constants");
const video_caption_1 = require("./video-caption");
const url_1 = require("../../lib/activitypub/url");
const misc_1 = require("../../helpers/custom-validators/misc");
const webtorrent_1 = require("@server/helpers/webtorrent");
const video_2 = require("@server/helpers/video");
function videoModelToFormattedJSON(video, options) {
    const userHistory = misc_1.isArray(video.UserVideoHistories) ? video.UserVideoHistories[0] : undefined;
    const videoObject = {
        id: video.id,
        uuid: video.uuid,
        name: video.name,
        category: {
            id: video.category,
            label: video_1.VideoModel.getCategoryLabel(video.category)
        },
        licence: {
            id: video.licence,
            label: video_1.VideoModel.getLicenceLabel(video.licence)
        },
        language: {
            id: video.language,
            label: video_1.VideoModel.getLanguageLabel(video.language)
        },
        privacy: {
            id: video.privacy,
            label: video_1.VideoModel.getPrivacyLabel(video.privacy)
        },
        nsfw: video.nsfw,
        description: options && options.completeDescription === true ? video.description : video.getTruncatedDescription(),
        isLocal: video.isOwned(),
        duration: video.duration,
        views: video.views,
        likes: video.likes,
        dislikes: video.dislikes,
        thumbnailPath: video.getMiniatureStaticPath(),
        previewPath: video.getPreviewStaticPath(),
        embedPath: video.getEmbedStaticPath(),
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        publishedAt: video.publishedAt,
        originallyPublishedAt: video.originallyPublishedAt,
        account: video.VideoChannel.Account.toFormattedSummaryJSON(),
        channel: video.VideoChannel.toFormattedSummaryJSON(),
        userHistory: userHistory ? {
            currentTime: userHistory.currentTime
        } : undefined
    };
    if (options) {
        if (options.additionalAttributes.state === true) {
            videoObject.state = {
                id: video.state,
                label: video_1.VideoModel.getStateLabel(video.state)
            };
        }
        if (options.additionalAttributes.waitTranscoding === true) {
            videoObject.waitTranscoding = video.waitTranscoding;
        }
        if (options.additionalAttributes.scheduledUpdate === true && video.ScheduleVideoUpdate) {
            videoObject.scheduledUpdate = {
                updateAt: video.ScheduleVideoUpdate.updateAt,
                privacy: video.ScheduleVideoUpdate.privacy || undefined
            };
        }
        if (options.additionalAttributes.blacklistInfo === true) {
            videoObject.blacklisted = !!video.VideoBlacklist;
            videoObject.blacklistedReason = video.VideoBlacklist ? video.VideoBlacklist.reason : null;
        }
    }
    return videoObject;
}
exports.videoModelToFormattedJSON = videoModelToFormattedJSON;
function videoModelToFormattedDetailsJSON(video) {
    const formattedJson = video.toFormattedJSON({
        additionalAttributes: {
            scheduledUpdate: true,
            blacklistInfo: true
        }
    });
    const { baseUrlHttp, baseUrlWs } = video.getBaseUrls();
    const tags = video.Tags ? video.Tags.map(t => t.name) : [];
    const streamingPlaylists = streamingPlaylistsModelToFormattedJSON(video, video.VideoStreamingPlaylists);
    const detailsJson = {
        support: video.support,
        descriptionPath: video.getDescriptionAPIPath(),
        channel: video.VideoChannel.toFormattedJSON(),
        account: video.VideoChannel.Account.toFormattedJSON(),
        tags,
        commentsEnabled: video.commentsEnabled,
        downloadEnabled: video.downloadEnabled,
        waitTranscoding: video.waitTranscoding,
        state: {
            id: video.state,
            label: video_1.VideoModel.getStateLabel(video.state)
        },
        trackerUrls: video.getTrackerUrls(baseUrlHttp, baseUrlWs),
        files: [],
        streamingPlaylists
    };
    detailsJson.files = videoFilesModelToFormattedJSON(video, baseUrlHttp, baseUrlWs, video.VideoFiles);
    return Object.assign(formattedJson, detailsJson);
}
exports.videoModelToFormattedDetailsJSON = videoModelToFormattedDetailsJSON;
function streamingPlaylistsModelToFormattedJSON(video, playlists) {
    if (misc_1.isArray(playlists) === false)
        return [];
    const { baseUrlHttp, baseUrlWs } = video.getBaseUrls();
    return playlists
        .map(playlist => {
        const playlistWithVideo = Object.assign(playlist, { Video: video });
        const redundancies = misc_1.isArray(playlist.RedundancyVideos)
            ? playlist.RedundancyVideos.map(r => ({ baseUrl: r.fileUrl }))
            : [];
        const files = videoFilesModelToFormattedJSON(playlistWithVideo, baseUrlHttp, baseUrlWs, playlist.VideoFiles);
        return {
            id: playlist.id,
            type: playlist.type,
            playlistUrl: playlist.playlistUrl,
            segmentsSha256Url: playlist.segmentsSha256Url,
            redundancies,
            files
        };
    });
}
function videoFilesModelToFormattedJSON(model, baseUrlHttp, baseUrlWs, videoFiles) {
    const video = video_2.extractVideo(model);
    return videoFiles
        .map(videoFile => {
        return {
            resolution: {
                id: videoFile.resolution,
                label: videoFile.resolution + 'p'
            },
            magnetUri: webtorrent_1.generateMagnetUri(model, videoFile, baseUrlHttp, baseUrlWs),
            size: videoFile.size,
            fps: videoFile.fps,
            torrentUrl: model.getTorrentUrl(videoFile, baseUrlHttp),
            torrentDownloadUrl: model.getTorrentDownloadUrl(videoFile, baseUrlHttp),
            fileUrl: model.getVideoFileUrl(videoFile, baseUrlHttp),
            fileDownloadUrl: model.getVideoFileDownloadUrl(videoFile, baseUrlHttp),
            metadataUrl: video.getVideoFileMetadataUrl(videoFile, baseUrlHttp)
        };
    })
        .sort((a, b) => {
        if (a.resolution.id < b.resolution.id)
            return 1;
        if (a.resolution.id === b.resolution.id)
            return 0;
        return -1;
    });
}
exports.videoFilesModelToFormattedJSON = videoFilesModelToFormattedJSON;
function addVideoFilesInAPAcc(acc, model, baseUrlHttp, baseUrlWs, files) {
    for (const file of files) {
        acc.push({
            type: 'Link',
            mediaType: constants_1.MIMETYPES.VIDEO.EXT_MIMETYPE[file.extname],
            href: model.getVideoFileUrl(file, baseUrlHttp),
            height: file.resolution,
            size: file.size,
            fps: file.fps
        });
        acc.push({
            type: 'Link',
            rel: ['metadata', constants_1.MIMETYPES.VIDEO.EXT_MIMETYPE[file.extname]],
            mediaType: 'application/json',
            href: video_2.extractVideo(model).getVideoFileMetadataUrl(file, baseUrlHttp),
            height: file.resolution,
            fps: file.fps
        });
        acc.push({
            type: 'Link',
            mediaType: 'application/x-bittorrent',
            href: model.getTorrentUrl(file, baseUrlHttp),
            height: file.resolution
        });
        acc.push({
            type: 'Link',
            mediaType: 'application/x-bittorrent;x-scheme-handler/magnet',
            href: webtorrent_1.generateMagnetUri(model, file, baseUrlHttp, baseUrlWs),
            height: file.resolution
        });
    }
}
function videoModelToActivityPubObject(video) {
    const { baseUrlHttp, baseUrlWs } = video.getBaseUrls();
    if (!video.Tags)
        video.Tags = [];
    const tag = video.Tags.map(t => ({
        type: 'Hashtag',
        name: t.name
    }));
    let language;
    if (video.language) {
        language = {
            identifier: video.language,
            name: video_1.VideoModel.getLanguageLabel(video.language)
        };
    }
    let category;
    if (video.category) {
        category = {
            identifier: video.category + '',
            name: video_1.VideoModel.getCategoryLabel(video.category)
        };
    }
    let licence;
    if (video.licence) {
        licence = {
            identifier: video.licence + '',
            name: video_1.VideoModel.getLicenceLabel(video.licence)
        };
    }
    const url = [
        {
            type: 'Link',
            mediaType: 'text/html',
            href: constants_1.WEBSERVER.URL + '/videos/watch/' + video.uuid
        }
    ];
    addVideoFilesInAPAcc(url, video, baseUrlHttp, baseUrlWs, video.VideoFiles || []);
    for (const playlist of (video.VideoStreamingPlaylists || [])) {
        const tag = playlist.p2pMediaLoaderInfohashes
            .map(i => ({ type: 'Infohash', name: i }));
        tag.push({
            type: 'Link',
            name: 'sha256',
            mediaType: 'application/json',
            href: playlist.segmentsSha256Url
        });
        const playlistWithVideo = Object.assign(playlist, { Video: video });
        addVideoFilesInAPAcc(tag, playlistWithVideo, baseUrlHttp, baseUrlWs, playlist.VideoFiles || []);
        url.push({
            type: 'Link',
            mediaType: 'application/x-mpegURL',
            href: playlist.playlistUrl,
            tag
        });
    }
    const subtitleLanguage = [];
    for (const caption of video.VideoCaptions) {
        subtitleLanguage.push({
            identifier: caption.language,
            name: video_caption_1.VideoCaptionModel.getLanguageLabel(caption.language),
            url: caption.getFileUrl(video)
        });
    }
    const miniature = video.getMiniature();
    return {
        type: 'Video',
        id: video.url,
        name: video.name,
        duration: getActivityStreamDuration(video.duration),
        uuid: video.uuid,
        tag,
        category,
        licence,
        language,
        views: video.views,
        sensitive: video.nsfw,
        waitTranscoding: video.waitTranscoding,
        state: video.state,
        commentsEnabled: video.commentsEnabled,
        downloadEnabled: video.downloadEnabled,
        published: video.publishedAt.toISOString(),
        originallyPublishedAt: video.originallyPublishedAt ? video.originallyPublishedAt.toISOString() : null,
        updated: video.updatedAt.toISOString(),
        mediaType: 'text/markdown',
        content: video.getTruncatedDescription(),
        support: video.support,
        subtitleLanguage,
        icon: {
            type: 'Image',
            url: miniature.getFileUrl(video),
            mediaType: 'image/jpeg',
            width: miniature.width,
            height: miniature.height
        },
        url,
        likes: url_1.getVideoLikesActivityPubUrl(video),
        dislikes: url_1.getVideoDislikesActivityPubUrl(video),
        shares: url_1.getVideoSharesActivityPubUrl(video),
        comments: url_1.getVideoCommentsActivityPubUrl(video),
        attributedTo: [
            {
                type: 'Person',
                id: video.VideoChannel.Account.Actor.url
            },
            {
                type: 'Group',
                id: video.VideoChannel.Actor.url
            }
        ]
    };
}
exports.videoModelToActivityPubObject = videoModelToActivityPubObject;
function getActivityStreamDuration(duration) {
    return 'PT' + duration + 'S';
}
exports.getActivityStreamDuration = getActivityStreamDuration;
