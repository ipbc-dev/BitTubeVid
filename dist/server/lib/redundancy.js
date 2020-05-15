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
const video_redundancy_1 = require("../models/redundancy/video-redundancy");
const send_1 = require("./activitypub/send");
const utils_1 = require("../helpers/utils");
function removeVideoRedundancy(videoRedundancy, t) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverActor = yield utils_1.getServerActor();
        if (videoRedundancy.actorId === serverActor.id)
            yield send_1.sendUndoCacheFile(serverActor, videoRedundancy, t);
        yield videoRedundancy.destroy({ transaction: t });
    });
}
exports.removeVideoRedundancy = removeVideoRedundancy;
function removeRedundanciesOfServer(serverId) {
    return __awaiter(this, void 0, void 0, function* () {
        const redundancies = yield video_redundancy_1.VideoRedundancyModel.listLocalOfServer(serverId);
        for (const redundancy of redundancies) {
            yield removeVideoRedundancy(redundancy);
        }
    });
}
exports.removeRedundanciesOfServer = removeRedundanciesOfServer;
