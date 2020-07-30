"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processActivityPubHttpBroadcast = void 0;
const tslib_1 = require("tslib");
const Bluebird = require("bluebird");
const logger_1 = require("../../../helpers/logger");
const requests_1 = require("../../../helpers/requests");
const activitypub_http_utils_1 = require("./utils/activitypub-http-utils");
const constants_1 = require("../../../initializers/constants");
const files_cache_1 = require("../../files-cache");
function processActivityPubHttpBroadcast(job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Processing ActivityPub broadcast in job %d.', job.id);
        const payload = job.data;
        const body = yield activitypub_http_utils_1.computeBody(payload);
        const httpSignatureOptions = yield activitypub_http_utils_1.buildSignedRequestOptions(payload);
        const options = {
            method: 'POST',
            uri: '',
            json: body,
            httpSignature: httpSignatureOptions,
            timeout: constants_1.JOB_REQUEST_TIMEOUT,
            headers: activitypub_http_utils_1.buildGlobalHeaders(body)
        };
        const badUrls = [];
        const goodUrls = [];
        yield Bluebird.map(payload.uris, uri => {
            return requests_1.doRequest(Object.assign({}, options, { uri }))
                .then(() => goodUrls.push(uri))
                .catch(() => badUrls.push(uri));
        }, { concurrency: constants_1.BROADCAST_CONCURRENCY });
        return files_cache_1.ActorFollowScoreCache.Instance.updateActorFollowsScore(goodUrls, badUrls);
    });
}
exports.processActivityPubHttpBroadcast = processActivityPubHttpBroadcast;
