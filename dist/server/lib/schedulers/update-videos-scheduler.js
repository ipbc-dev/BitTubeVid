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
const logger_1 = require("../../helpers/logger");
const abstract_scheduler_1 = require("./abstract-scheduler");
const schedule_video_update_1 = require("../../models/video/schedule-video-update");
const database_utils_1 = require("../../helpers/database-utils");
const activitypub_1 = require("../activitypub");
const constants_1 = require("../../initializers/constants");
const notifier_1 = require("../notifier");
const database_1 = require("../../initializers/database");
class UpdateVideosScheduler extends abstract_scheduler_1.AbstractScheduler {
    constructor() {
        super();
        this.schedulerIntervalMs = constants_1.SCHEDULER_INTERVALS_MS.updateVideos;
    }
    internalExecute() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_utils_1.retryTransactionWrapper(this.updateVideos.bind(this));
        });
    }
    updateVideos() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield schedule_video_update_1.ScheduleVideoUpdateModel.areVideosToUpdate()))
                return undefined;
            const publishedVideos = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                const schedules = yield schedule_video_update_1.ScheduleVideoUpdateModel.listVideosToUpdate(t);
                const publishedVideos = [];
                for (const schedule of schedules) {
                    const video = schedule.Video;
                    logger_1.logger.info('Executing scheduled video update on %s.', video.uuid);
                    if (schedule.privacy) {
                        const wasConfidentialVideo = video.isConfidential();
                        const isNewVideo = video.isNewVideo(schedule.privacy);
                        video.setPrivacy(schedule.privacy);
                        yield video.save({ transaction: t });
                        yield activitypub_1.federateVideoIfNeeded(video, isNewVideo, t);
                        if (wasConfidentialVideo) {
                            const videoToPublish = Object.assign(video, { ScheduleVideoUpdate: schedule, UserVideoHistories: [] });
                            publishedVideos.push(videoToPublish);
                        }
                    }
                    yield schedule.destroy({ transaction: t });
                }
                return publishedVideos;
            }));
            for (const v of publishedVideos) {
                notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(v);
                notifier_1.Notifier.Instance.notifyOnVideoPublishedAfterScheduledUpdate(v);
            }
        });
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.UpdateVideosScheduler = UpdateVideosScheduler;
