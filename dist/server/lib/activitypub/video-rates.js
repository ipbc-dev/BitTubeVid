"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVideoRateChange = exports.createRates = exports.getLocalRateUrl = void 0;
const tslib_1 = require("tslib");
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield Bluebird.map(ratesUrl, (rateUrl) => tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                yield account_video_rate_1.AccountVideoRateModel.upsert(entry);
            }
            catch (err) {
                logger_1.logger.warn('Cannot add rate %s.', rateUrl, { err });
            }
        }), { concurrency: constants_1.CRAWL_REQUEST_CONCURRENCY });
    });
}
exports.createRates = createRates;
function sendVideoRateChange(account, video, likes, dislikes, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
function getLocalRateUrl(rateType, actor, video) {
    return rateType === 'like'
        ? url_1.getVideoLikeActivityPubUrlByLocalActor(actor, video)
        : url_1.getVideoDislikeActivityPubUrlByLocalActor(actor, video);
}
exports.getLocalRateUrl = getLocalRateUrl;
