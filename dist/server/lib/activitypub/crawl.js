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
const constants_1 = require("../../initializers/constants");
const requests_1 = require("../../helpers/requests");
const logger_1 = require("../../helpers/logger");
const url_1 = require("url");
function crawlCollectionPage(uri, handler, cleaner) {
    return __awaiter(this, void 0, void 0, function* () {
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
