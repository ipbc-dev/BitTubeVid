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
const video_change_ownership_1 = require("../../models/video/video-change-ownership");
function doesChangeVideoOwnershipExist(idArg, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
