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
const send_1 = require("./send");
const Bluebird = require("bluebird");
const actor_1 = require("./actor");
const account_video_rate_1 = require("../../models/account/account-video-rate");
const logger_1 = require("../../helpers/logger");
const constants_1 = require("../../initializers/constants");
const requests_1 = require("../../helpers/requests");
const activitypub_1 = require("../../helpers/activitypub");
const url_1 = require("./url");
const send_dislike_1 = require("./send/send-dislike");
function createRates(ratesUrl, video, rate) {
    return __awaiter(this, void 0, void 0, function* () {
        let rateCounts = 0;
        yield Bluebird.map(ratesUrl, (rateUrl) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = yield requests_1.doRequest({
                    uri: rateUrl,
                    json: true,
                    activityPub: true
                });
                if (!body || !body.actor)
                    throw new Error('Body or body actor is invalid');
                const actorUrl = activitypub_1.getAPId(body.actor);
                if (activitypub_1.checkUrlsSameHost(actorUrl, rateUrl) !== true) {
                    throw new Error(`Rate url ${rateUrl} has not the same host than actor url ${actorUrl}`);
                }
                if (activitypub_1.checkUrlsSameHost(body.id, rateUrl) !== true) {
                    throw new Error(`Rate url ${rateUrl} host is different from the AP object id ${body.id}`);
                }
                const actor = yield actor_1.getOrCreateActorAndServerAndModel(actorUrl);
                const entry = {
                    videoId: video.id,
                    accountId: actor.Account.id,
                    type: rate,
                    url: body.id
                };
                const created = yield account_video_rate_1.AccountVideoRateModel.upsert(entry);
                if (created)
                    rateCounts += 1;
            }
            catch (err) {
                logger_1.logger.warn('Cannot add rate %s.', rateUrl, { err });
            }
        }), { concurrency: constants_1.CRAWL_REQUEST_CONCURRENCY });
        logger_1.logger.info('Adding %d %s to video %s.', rateCounts, rate, video.uuid);
        if (rateCounts !== 0) {
            const field = rate === 'like' ? 'likes' : 'dislikes';
            yield video.increment(field, { by: rateCounts });
        }
    });
}
exports.createRates = createRates;
function sendVideoRateChange(account, video, likes, dislikes, t) {
    return __awaiter(this, void 0, void 0, function* () {
        const actor = account.Actor;
        if (likes < 0)
            yield send_1.sendUndoLike(actor, video, t);
        if (dislikes < 0)
            yield send_1.sendUndoDislike(actor, video, t);
        if (likes > 0)
            yield send_1.sendLike(actor, video, t);
        if (dislikes > 0)
            yield send_dislike_1.sendDislike(actor, video, t);
    });
}
exports.sendVideoRateChange = sendVideoRateChange;
function getRateUrl(rateType, actor, video) {
    return rateType === 'like'
        ? url_1.getVideoLikeActivityPubUrl(actor, video)
        : url_1.getVideoDislikeActivityPubUrl(actor, video);
}
exports.getRateUrl = getRateUrl;
