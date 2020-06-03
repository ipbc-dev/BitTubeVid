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
const express_validator_1 = require("express-validator");
const misc_1 = require("../../helpers/custom-validators/misc");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const video_redundancy_1 = require("../../models/redundancy/video-redundancy");
const servers_1 = require("../../helpers/custom-validators/servers");
const server_1 = require("../../models/server/server");
const middlewares_1 = require("../../helpers/middlewares");
const video_redundancies_1 = require("@server/helpers/custom-validators/video-redundancies");
const videoFileRedundancyGetValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid video id'),
    express_validator_1.param('resolution')
        .customSanitizer(misc_1.toIntOrNull)
        .custom(misc_1.exists).withMessage('Should have a valid resolution'),
    express_validator_1.param('fps')
        .optional()
        .customSanitizer(misc_1.toIntOrNull)
        .custom(misc_1.exists).withMessage('Should have a valid fps'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoFileRedundancyGetValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        const video = res.locals.videoAll;
        const paramResolution = req.params.resolution;
        const paramFPS = req.params.fps;
        const videoFile = video.VideoFiles.find(f => {
            return f.resolution === paramResolution && (!req.params.fps || paramFPS);
        });
        if (!videoFile)
            return res.status(404).json({ error: 'Video file not found.' });
        res.locals.videoFile = videoFile;
        const videoRedundancy = yield video_redundancy_1.VideoRedundancyModel.loadLocalByFileId(videoFile.id);
        if (!videoRedundancy)
            return res.status(404).json({ error: 'Video redundancy not found.' });
        res.locals.videoRedundancy = videoRedundancy;
        return next();
    })
];
exports.videoFileRedundancyGetValidator = videoFileRedundancyGetValidator;
const videoPlaylistRedundancyGetValidator = [
    express_validator_1.param('videoId')
        .custom(misc_1.isIdOrUUIDValid)
        .not().isEmpty().withMessage('Should have a valid video id'),
    express_validator_1.param('streamingPlaylistType')
        .customSanitizer(misc_1.toIntOrNull)
        .custom(misc_1.exists).withMessage('Should have a valid streaming playlist type'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoPlaylistRedundancyGetValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        const video = res.locals.videoAll;
        const paramPlaylistType = req.params.streamingPlaylistType;
        const videoStreamingPlaylist = video.VideoStreamingPlaylists.find(p => p.type === paramPlaylistType);
        if (!videoStreamingPlaylist)
            return res.status(404).json({ error: 'Video playlist not found.' });
        res.locals.videoStreamingPlaylist = videoStreamingPlaylist;
        const videoRedundancy = yield video_redundancy_1.VideoRedundancyModel.loadLocalByStreamingPlaylistId(videoStreamingPlaylist.id);
        if (!videoRedundancy)
            return res.status(404).json({ error: 'Video redundancy not found.' });
        res.locals.videoRedundancy = videoRedundancy;
        return next();
    })
];
exports.videoPlaylistRedundancyGetValidator = videoPlaylistRedundancyGetValidator;
const updateServerRedundancyValidator = [
    express_validator_1.param('host').custom(servers_1.isHostValid).withMessage('Should have a valid host'),
    express_validator_1.body('redundancyAllowed')
        .customSanitizer(misc_1.toBooleanOrNull)
        .custom(misc_1.isBooleanValid).withMessage('Should have a valid redundancyAllowed attribute'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking updateServerRedundancy parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        const server = yield server_1.ServerModel.loadByHost(req.params.host);
        if (!server) {
            return res
                .status(404)
                .json({
                error: `Server ${req.params.host} not found.`
            })
                .end();
        }
        res.locals.server = server;
        return next();
    })
];
exports.updateServerRedundancyValidator = updateServerRedundancyValidator;
const listVideoRedundanciesValidator = [
    express_validator_1.query('target')
        .custom(video_redundancies_1.isVideoRedundancyTarget).withMessage('Should have a valid video redundancies target'),
    (req, res, next) => {
        logger_1.logger.debug('Checking listVideoRedundanciesValidator parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.listVideoRedundanciesValidator = listVideoRedundanciesValidator;
const addVideoRedundancyValidator = [
    express_validator_1.body('videoId')
        .custom(misc_1.isIdValid)
        .withMessage('Should have a valid video id'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking addVideoRedundancyValidator parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.body.videoId, res, 'only-video')))
            return;
        if (res.locals.onlyVideo.remote === false) {
            return res.status(400)
                .json({ error: 'Cannot create a redundancy on a local video' })
                .end();
        }
        const alreadyExists = yield video_redundancy_1.VideoRedundancyModel.isLocalByVideoUUIDExists(res.locals.onlyVideo.uuid);
        if (alreadyExists) {
            return res.status(409)
                .json({ error: 'This video is already duplicated by your instance.' });
        }
        return next();
    })
];
exports.addVideoRedundancyValidator = addVideoRedundancyValidator;
const removeVideoRedundancyValidator = [
    express_validator_1.param('redundancyId')
        .custom(misc_1.isIdValid)
        .withMessage('Should have a valid redundancy id'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking removeVideoRedundancyValidator parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        const redundancy = yield video_redundancy_1.VideoRedundancyModel.loadByIdWithVideo(parseInt(req.params.redundancyId, 10));
        if (!redundancy) {
            return res.status(404)
                .json({ error: 'Video redundancy not found' })
                .end();
        }
        res.locals.videoRedundancy = redundancy;
        return next();
    })
];
exports.removeVideoRedundancyValidator = removeVideoRedundancyValidator;
