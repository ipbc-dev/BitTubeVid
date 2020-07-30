"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserCanTerminateOwnershipChange = exports.doesChangeVideoOwnershipExist = void 0;
const tslib_1 = require("tslib");
const video_change_ownership_1 = require("../../models/video/video-change-ownership");
function doesChangeVideoOwnershipExist(idArg, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const id = parseInt(idArg + '', 10);
        const videoChangeOwnership = yield video_change_ownership_1.VideoChangeOwnershipModel.load(id);
        if (!videoChangeOwnership) {
            res.status(404)
                .json({ error: 'Video change ownership not found' })
                .end();
            return false;
        }
        res.locals.videoChangeOwnership = videoChangeOwnership;
        return true;
    });
}
exports.doesChangeVideoOwnershipExist = doesChangeVideoOwnershipExist;
function checkUserCanTerminateOwnershipChange(user, videoChangeOwnership, res) {
    if (videoChangeOwnership.NextOwner.userId === user.id) {
        return true;
    }
    res.status(403)
        .json({ error: 'Cannot terminate an ownership change of another user' })
        .end();
    return false;
}
exports.checkUserCanTerminateOwnershipChange = checkUserCanTerminateOwnershipChange;
