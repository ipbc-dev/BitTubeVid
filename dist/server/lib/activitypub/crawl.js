"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlCollectionPage = void 0;
const tslib_1 = require("tslib");
const constants_1 = require("../../initializers/constants");
const requests_1 = require("../../helpers/requests");
const logger_1 = require("../../helpers/logger");
const url_1 = require("url");
function crawlCollectionPage(uri, handler, cleaner) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Crawling ActivityPub data on %s.', uri);
        const options = {
            method: 'GET',
            uri,
            json: true,
            activityPub: true,
            timeout: constants_1.JOB_REQUEST_TIMEOUT
        };
        const startDate = new Date();
        const response = yield requests_1.doRequest(options);
        const firstBody = response.body;
        const limit = constants_1.ACTIVITY_PUB.FETCH_PAGE_LIMIT;
        let i = 0;
        let nextLink = firstBody.first;
        while (nextLink && i < limit) {
            let body;
            if (typeof nextLink === 'string') {
                const remoteHost = new url_1.URL(nextLink).host;
                if (remoteHost === constants_1.WEBSERVER.HOST)
                    continue;
                options.uri = nextLink;
                const res = yield requests_1.doRequest(options);
                body = res.body;
            }
            else {
                body = nextLink;
            }
            nextLink = body.next;
            i++;
            if (Array.isArray(body.orderedItems)) {
                const items = body.orderedItems;
                logger_1.logger.info('Processing %i ActivityPub items for %s.', items.length, options.uri);
                yield handler(items);
            }
        }
        if (cleaner)
            yield cleaner(startDate);
    });
}
exports.crawlCollectionPage = crawlCollectionPage;
