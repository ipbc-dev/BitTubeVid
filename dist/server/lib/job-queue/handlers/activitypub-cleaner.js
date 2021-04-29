"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processActivityPubCleaner = void 0;
const tslib_1 = require("tslib");
const Bluebird = require("bluebird");
const activitypub_1 = require("@server/helpers/activitypub");
const rate_1 = require("@server/helpers/custom-validators/activitypub/rate");
const share_1 = require("@server/helpers/custom-validators/activitypub/share");
const video_comments_1 = require("@server/helpers/custom-validators/activitypub/video-comments");
const requests_1 = require("@server/helpers/requests");
const constants_1 = require("@server/initializers/constants");
const video_1 = require("@server/models/video/video");
const video_comment_1 = require("@server/models/video/video-comment");
const video_share_1 = require("@server/models/video/video-share");
const core_utils_1 = require("@shared/core-utils");
const logger_1 = require("../../../helpers/logger");
const account_video_rate_1 = require("../../../models/account/account-video-rate");
function processActivityPubCleaner(_job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Processing ActivityPub cleaner.');
        {
            const rateUrls = yield account_video_rate_1.AccountVideoRateModel.listRemoteRateUrlsOfLocalVideos();
            const { bodyValidator, deleter, updater } = rateOptionsFactory();
            yield Bluebird.map(rateUrls, (rateUrl) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    const result = yield updateObjectIfNeeded(rateUrl, bodyValidator, updater, deleter);
                    if ((result === null || result === void 0 ? void 0 : result.status) === 'deleted') {
                        const { videoId, type } = result.data;
                        yield video_1.VideoModel.updateRatesOf(videoId, type, undefined);
                    }
                }
                catch (err) {
                    logger_1.logger.warn('Cannot update/delete remote AP rate %s.', rateUrl, { err });
                }
            }), { concurrency: constants_1.AP_CLEANER_CONCURRENCY });
        }
        {
            const shareUrls = yield video_share_1.VideoShareModel.listRemoteShareUrlsOfLocalVideos();
            const { bodyValidator, deleter, updater } = shareOptionsFactory();
            yield Bluebird.map(shareUrls, (shareUrl) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    yield updateObjectIfNeeded(shareUrl, bodyValidator, updater, deleter);
                }
                catch (err) {
                    logger_1.logger.warn('Cannot update/delete remote AP share %s.', shareUrl, { err });
                }
            }), { concurrency: constants_1.AP_CLEANER_CONCURRENCY });
        }
        {
            const commentUrls = yield video_comment_1.VideoCommentModel.listRemoteCommentUrlsOfLocalVideos();
            const { bodyValidator, deleter, updater } = commentOptionsFactory();
            yield Bluebird.map(commentUrls, (commentUrl) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    yield updateObjectIfNeeded(commentUrl, bodyValidator, updater, deleter);
                }
                catch (err) {
                    logger_1.logger.warn('Cannot update/delete remote AP comment %s.', commentUrl, { err });
                }
            }), { concurrency: constants_1.AP_CLEANER_CONCURRENCY });
        }
    });
}
exports.processActivityPubCleaner = processActivityPubCleaner;
function updateObjectIfNeeded(url, bodyValidator, updater, deleter) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { response, body } = yield requests_1.doRequest({
            uri: url,
            json: true,
            activityPub: true
        });
        if (response.statusCode === core_utils_1.HttpStatusCode.NOT_FOUND_404) {
            logger_1.logger.info('Removing remote AP object %s.', url);
            const data = yield deleter(url);
            return { status: 'deleted', data };
        }
        if (!body || !body.id || !bodyValidator(body))
            throw new Error(`Body or body id of ${url} is invalid`);
        if (body.type === 'Tombstone') {
            logger_1.logger.info('Removing remote AP object %s.', url);
            const data = yield deleter(url);
            return { status: 'deleted', data };
        }
        const newUrl = body.id;
        if (newUrl !== url) {
            if (activitypub_1.checkUrlsSameHost(newUrl, url) !== true) {
                throw new Error(`New url ${newUrl} has not the same host than old url ${url}`);
            }
            logger_1.logger.info('Updating remote AP object %s.', url);
            const data = yield updater(url, newUrl);
            return { status: 'updated', data };
        }
        return null;
    });
}
function rateOptionsFactory() {
    return {
        bodyValidator: (body) => rate_1.isLikeActivityValid(body) || rate_1.isDislikeActivityValid(body),
        updater: (url, newUrl) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const rate = yield account_video_rate_1.AccountVideoRateModel.loadByUrl(url, undefined);
            rate.url = newUrl;
            const videoId = rate.videoId;
            const type = rate.type;
            yield rate.save();
            return { videoId, type };
        }),
        deleter: (url) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const rate = yield account_video_rate_1.AccountVideoRateModel.loadByUrl(url, undefined);
            const videoId = rate.videoId;
            const type = rate.type;
            yield rate.destroy();
            return { videoId, type };
        })
    };
}
function shareOptionsFactory() {
    return {
        bodyValidator: (body) => share_1.isShareActivityValid(body),
        updater: (url, newUrl) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const share = yield video_share_1.VideoShareModel.loadByUrl(url, undefined);
            share.url = newUrl;
            yield share.save();
            return undefined;
        }),
        deleter: (url) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const share = yield video_share_1.VideoShareModel.loadByUrl(url, undefined);
            yield share.destroy();
            return undefined;
        })
    };
}
function commentOptionsFactory() {
    return {
        bodyValidator: (body) => video_comments_1.sanitizeAndCheckVideoCommentObject(body),
        updater: (url, newUrl) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const comment = yield video_comment_1.VideoCommentModel.loadByUrlAndPopulateAccountAndVideo(url);
            comment.url = newUrl;
            yield comment.save();
            return undefined;
        }),
        deleter: (url) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const comment = yield video_comment_1.VideoCommentModel.loadByUrlAndPopulateAccountAndVideo(url);
            yield comment.destroy();
            return undefined;
        })
    };
}
