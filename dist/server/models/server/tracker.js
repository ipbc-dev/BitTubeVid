"use strict";
var TrackerModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackerModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const video_1 = require("../video/video");
const video_tracker_1 = require("./video-tracker");
let TrackerModel = TrackerModel_1 = class TrackerModel extends sequelize_typescript_1.Model {
    static listUrlsByVideoId(videoId) {
        const query = {
            include: [
                {
                    attributes: ['id'],
                    model: video_1.VideoModel.unscoped(),
                    required: true,
                    where: { id: videoId }
                }
            ]
        };
        return TrackerModel_1.findAll(query)
            .then(rows => rows.map(rows => rows.url));
    }
    static findOrCreateTrackers(trackers, transaction) {
        if (trackers === null)
            return Promise.resolve([]);
        const tasks = [];
        trackers.forEach(tracker => {
            const query = {
                where: {
                    url: tracker
                },
                defaults: {
                    url: tracker
                },
                transaction
            };
            const promise = TrackerModel_1.findOrCreate(query)
                .then(([trackerInstance]) => trackerInstance);
            tasks.push(promise);
        });
        return Promise.all(tasks);
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], TrackerModel.prototype, "url", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], TrackerModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], TrackerModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsToMany(() => video_1.VideoModel, {
        foreignKey: 'trackerId',
        through: () => video_tracker_1.VideoTrackerModel,
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", Array)
], TrackerModel.prototype, "Videos", void 0);
TrackerModel = TrackerModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'tracker',
        indexes: [
            {
                fields: ['url'],
                unique: true
            }
        ]
    })
], TrackerModel);
exports.TrackerModel = TrackerModel;
