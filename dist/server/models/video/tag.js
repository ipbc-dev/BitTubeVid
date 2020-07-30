"use strict";
var TagModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagModel = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const videos_1 = require("../../helpers/custom-validators/videos");
const utils_1 = require("../utils");
const video_1 = require("./video");
const video_tag_1 = require("./video-tag");
const videos_2 = require("../../../shared/models/videos");
let TagModel = TagModel_1 = class TagModel extends sequelize_typescript_1.Model {
    static findOrCreateTags(tags, transaction) {
        if (tags === null)
            return Promise.resolve([]);
        const tasks = [];
        tags.forEach(tag => {
            const query = {
                where: {
                    name: tag
                },
                defaults: {
                    name: tag
                },
                transaction
            };
            const promise = TagModel_1.findOrCreate(query)
                .then(([tagInstance]) => tagInstance);
            tasks.push(promise);
        });
        return Promise.all(tasks);
    }
    static getRandomSamples(threshold, count) {
        const query = 'SELECT tag.name FROM tag ' +
            'INNER JOIN "videoTag" ON "videoTag"."tagId" = tag.id ' +
            'INNER JOIN video ON video.id = "videoTag"."videoId" ' +
            'WHERE video.privacy = $videoPrivacy AND video.state = $videoState ' +
            'GROUP BY tag.name HAVING COUNT(tag.name) >= $threshold ' +
            'ORDER BY random() ' +
            'LIMIT $count';
        const options = {
            bind: { threshold, count, videoPrivacy: videos_2.VideoPrivacy.PUBLIC, videoState: videos_2.VideoState.PUBLISHED },
            type: sequelize_1.QueryTypes.SELECT
        };
        return TagModel_1.sequelize.query(query, options)
            .then(data => data.map(d => d.name));
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoTag', value => utils_1.throwIfNotValid(value, videos_1.isVideoTagValid, 'tag')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], TagModel.prototype, "name", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], TagModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], TagModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsToMany(() => video_1.VideoModel, {
        foreignKey: 'tagId',
        through: () => video_tag_1.VideoTagModel,
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", Array)
], TagModel.prototype, "Videos", void 0);
TagModel = TagModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'tag',
        timestamps: false,
        indexes: [
            {
                fields: ['name'],
                unique: true
            },
            {
                name: 'tag_lower_name',
                fields: [sequelize_1.fn('lower', sequelize_1.col('name'))]
            }
        ]
    })
], TagModel);
exports.TagModel = TagModel;
