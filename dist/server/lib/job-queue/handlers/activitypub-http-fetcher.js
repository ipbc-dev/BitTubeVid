"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processActivityPubHttpFetcher = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../../../helpers/logger");
const account_1 = require("../../../models/account/account");
const account_video_rate_1 = require("../../../models/account/account-video-rate");
const video_1 = require("../../../models/video/video");
const video_comment_1 = require("../../../models/video/video-comment");
const video_share_1 = require("../../../models/video/video-share");
const crawl_1 = require("../../activitypub/crawl");
const playlist_1 = require("../../activitypub/playlist");
const process_1 = require("../../activitypub/process");
const share_1 = require("../../activitypub/share");
const video_comments_1 = require("../../activitypub/video-comments");
const video_rates_1 = require("../../activitypub/video-rates");
function processActivityPubHttpFetcher(job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Processing ActivityPub fetcher in job %d.', job.id);
        const payload = job.data;
        let video;
        if (payload.videoId)
            video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(payload.videoId);
        let account;
        if (payload.accountId)
            account = yield account_1.AccountModel.load(payload.accountId);
        const fetcherType = {
            'activity': items => process_1.processActivities(items, { outboxUrl: payload.uri, fromFetch: true }),
            'video-likes': items => video_rates_1.createRates(items, video, 'like'),
            'video-dislikes': items => video_rates_1.createRates(items, video, 'dislike'),
            'video-shares': items => share_1.addVideoShares(items, video),
            'video-comments': items => video_comments_1.addVideoComments(items),
            'account-playlists': items => playlist_1.createAccountPlaylists(items, account)
        };
        const cleanerType = {
            'video-likes': crawlStartDate => account_video_rate_1.AccountVideoRateModel.cleanOldRatesOf(video.id, 'like', crawlStartDate),
            'video-dislikes': crawlStartDate => account_video_rate_1.AccountVideoRateModel.cleanOldRatesOf(video.id, 'dislike', crawlStartDate),
            'video-shares': crawlStartDate => video_share_1.VideoShareModel.cleanOldSharesOf(video.id, crawlStartDate),
            'video-comments': crawlStartDate => video_comment_1.VideoCommentModel.cleanOldCommentsOf(video.id, crawlStartDate)
        };
        return crawl_1.crawlCollectionPage(payload.uri, fetcherType[payload.type], cleanerType[payload.type]);
    });
}
exports.processActivityPubHttpFetcher = processActivityPubHttpFetcher;
