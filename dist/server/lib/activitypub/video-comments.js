"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveThread = exports.addVideoComments = void 0;
const tslib_1 = require("tslib");
const video_comments_1 = require("../../helpers/custom-validators/activitypub/video-comments");
const logger_1 = require("../../helpers/logger");
const requests_1 = require("../../helpers/requests");
const constants_1 = require("../../initializers/constants");
const video_comment_1 = require("../../models/video/video-comment");
const actor_1 = require("./actor");
const videos_1 = require("./videos");
const Bluebird = require("bluebird");
const activitypub_1 = require("../../helpers/activitypub");
function addVideoComments(commentUrls) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return Bluebird.map(commentUrls, commentUrl => {
            return resolveThread({ url: commentUrl, isVideo: false });
        }, { concurrency: constants_1.CRAWL_REQUEST_CONCURRENCY });
    });
}
exports.addVideoComments = addVideoComments;
function resolveThread(params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { url, isVideo } = params;
        if (params.commentCreated === undefined)
            params.commentCreated = false;
        if (params.comments === undefined)
            params.comments = [];
        if (isVideo !== true) {
            const result = yield resolveCommentFromDB(params);
            if (result)
                return result;
        }
        try {
            if (isVideo !== false)
                return yield tryResolveThreadFromVideo(params);
            return resolveParentComment(params);
        }
        catch (err) {
            logger_1.logger.debug('Cannot get or create account and video and channel for reply %s, fetch comment', url, { err });
            return resolveParentComment(params);
        }
    });
}
exports.resolveThread = resolveThread;
function resolveCommentFromDB(params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { url, comments, commentCreated } = params;
        const commentFromDatabase = yield video_comment_1.VideoCommentModel.loadByUrlAndPopulateReplyAndVideoUrlAndAccount(url);
        if (commentFromDatabase) {
            let parentComments = comments.concat([commentFromDatabase]);
            if (commentFromDatabase.InReplyToVideoComment) {
                const data = yield video_comment_1.VideoCommentModel.listThreadParentComments(commentFromDatabase, undefined, 'DESC');
                parentComments = parentComments.concat(data);
            }
            return resolveThread({
                url: commentFromDatabase.Video.url,
                comments: parentComments,
                isVideo: true,
                commentCreated
            });
        }
        return undefined;
    });
}
function tryResolveThreadFromVideo(params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { url, comments, commentCreated } = params;
        const syncParam = { likes: true, dislikes: true, shares: true, comments: false, thumbnail: true, refreshVideo: false };
        const { video } = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: url, syncParam });
        let resultComment;
        if (comments.length !== 0) {
            const firstReply = comments[comments.length - 1];
            firstReply.inReplyToCommentId = null;
            firstReply.originCommentId = null;
            firstReply.videoId = video.id;
            firstReply.changed('updatedAt', true);
            firstReply.Video = video;
            comments[comments.length - 1] = yield firstReply.save();
            for (let i = comments.length - 2; i >= 0; i--) {
                const comment = comments[i];
                comment.originCommentId = firstReply.id;
                comment.inReplyToCommentId = comments[i + 1].id;
                comment.videoId = video.id;
                comment.changed('updatedAt', true);
                comment.Video = video;
                comments[i] = yield comment.save();
            }
            resultComment = comments[0];
        }
        return { video, comment: resultComment, commentCreated };
    });
}
function resolveParentComment(params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { url, comments } = params;
        if (comments.length > constants_1.ACTIVITY_PUB.MAX_RECURSION_COMMENTS) {
            throw new Error('Recursion limit reached when resolving a thread');
        }
        const { body } = yield requests_1.doRequest({
            uri: url,
            json: true,
            activityPub: true
        });
        if (video_comments_1.sanitizeAndCheckVideoCommentObject(body) === false) {
            throw new Error('Remote video comment JSON is not valid:' + JSON.stringify(body));
        }
        const actorUrl = body.attributedTo;
        if (!actorUrl && body.type !== 'Tombstone')
            throw new Error('Miss attributed to in comment');
        if (actorUrl && activitypub_1.checkUrlsSameHost(url, actorUrl) !== true) {
            throw new Error(`Actor url ${actorUrl} has not the same host than the comment url ${url}`);
        }
        if (activitypub_1.checkUrlsSameHost(body.id, url) !== true) {
            throw new Error(`Comment url ${url} host is different from the AP object id ${body.id}`);
        }
        const actor = actorUrl
            ? yield actor_1.getOrCreateActorAndServerAndModel(actorUrl, 'all')
            : null;
        const comment = new video_comment_1.VideoCommentModel({
            url: body.id,
            text: body.content ? body.content : '',
            videoId: null,
            accountId: actor ? actor.Account.id : null,
            inReplyToCommentId: null,
            originCommentId: null,
            createdAt: new Date(body.published),
            updatedAt: new Date(body.updated),
            deletedAt: body.deleted ? new Date(body.deleted) : null
        });
        comment.Account = actor ? actor.Account : null;
        return resolveThread({
            url: body.inReplyTo,
            comments: comments.concat([comment]),
            commentCreated: true
        });
    });
}
