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
const logger_1 = require("../../../helpers/logger");
const process_1 = require("../../activitypub/process");
const video_comments_1 = require("../../activitypub/video-comments");
const crawl_1 = require("../../activitypub/crawl");
const video_1 = require("../../../models/video/video");
const share_1 = require("../../activitypub/share");
const video_rates_1 = require("../../activitypub/video-rates");
const playlist_1 = require("../../activitypub/playlist");
const account_1 = require("../../../models/account/account");
const account_video_rate_1 = require("../../../models/account/account-video-rate");
const video_share_1 = require("../../../models/video/video-share");
const video_comment_1 = require("../../../models/video/video-comment");
function processActivityPubHttpFetcher(job) {
    return __awaiter(this, void 0, void 0, function* () {
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
