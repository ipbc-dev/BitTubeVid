"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveRouter = void 0;
const cors = require("cors");
const express = require("express");
const core_utils_1 = require("@server/helpers/core-utils");
const live_manager_1 = require("@server/lib/live-manager");
const http_error_codes_1 = require("@shared/core-utils/miscs/http-error-codes");
const liveRouter = express.Router();
exports.liveRouter = liveRouter;
liveRouter.use('/segments-sha256/:videoUUID', cors(), getSegmentsSha256);
function getSegmentsSha256(req, res) {
    const videoUUID = req.params.videoUUID;
    const result = live_manager_1.LiveManager.Instance.getSegmentsSha256(videoUUID);
    if (!result) {
        return res.sendStatus(http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
    }
    return res.json(core_utils_1.mapToJSON(result));
}
