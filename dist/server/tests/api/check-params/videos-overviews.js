"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const overviews_1 = require("@shared/extra-utils/overviews/overviews");
describe('Test videos overview', function () {
    let server;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
        });
    });
    describe('When getting videos overview', function () {
        it('Should fail with a bad pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield overviews_1.getVideosOverview(server.url, 0, 400);
                yield overviews_1.getVideosOverview(server.url, 100, 400);
            });
        });
        it('Should succeed with a good pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield overviews_1.getVideosOverview(server.url, 1);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
