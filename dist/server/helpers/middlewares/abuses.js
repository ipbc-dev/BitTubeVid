"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesVideoAbuseExist = exports.doesAbuseExist = void 0;
const tslib_1 = require("tslib");
const abuse_1 = require("../../models/abuse/abuse");
const video_1 = require("../video");
function doesVideoAbuseExist(abuseIdArg, videoUUID, res) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const abuseId = parseInt(abuseIdArg + '', 10);
        let abuse = yield abuse_1.AbuseModel.loadByIdAndVideoId(abuseId, null, videoUUID);
        if (!abuse) {
            const userId = (_a = res.locals.oauth) === null || _a === void 0 ? void 0 : _a.token.User.id;
            const video = yield video_1.fetchVideo(videoUUID, 'all', userId);
            if (video)
                abuse = yield abuse_1.AbuseModel.loadByIdAndVideoId(abuseId, video.id);
        }
        if (abuse === null) {
            res.status(404)
                .json({ error: 'Video abuse not found' });
            return false;
        }
        res.locals.abuse = abuse;
        return true;
    });
}
exports.doesVideoAbuseExist = doesVideoAbuseExist;
function doesAbuseExist(abuseId, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const abuse = yield abuse_1.AbuseModel.loadByIdWithReporter(parseInt(abuseId + '', 10));
        if (!abuse) {
            res.status(404)
                .json({ error: 'Abuse not found' });
            return false;
        }
        res.locals.abuse = abuse;
        return true;
    });
}
exports.doesAbuseExist = doesAbuseExist;
