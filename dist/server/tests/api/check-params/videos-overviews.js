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
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const overviews_1 = require("@shared/extra-utils/overviews/overviews");
describe('Test videos overview', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
        });
    });
    describe('When getting videos overview', function () {
        it('Should fail with a bad pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield overviews_1.getVideosOverview(server.url, 0, 400);
                yield overviews_1.getVideosOverview(server.url, 100, 400);
            });
        });
        it('Should succeed with a good pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield overviews_1.getVideosOverview(server.url, 1);
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
