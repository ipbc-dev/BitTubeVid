"use strict";
var UserVideoHistoryModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserVideoHistoryModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const video_1 = require("../video/video");
const user_1 = require("./user");
const sequelize_1 = require("sequelize");
let UserVideoHistoryModel = UserVideoHistoryModel_1 = class UserVideoHistoryModel extends sequelize_typescript_1.Model {
    static listForApi(user, start, count, search) {
        return video_1.VideoModel.listForApi({
            start,
            count,
            search,
            sort: '-"userVideoHistory"."updatedAt"',
            nsfw: null,
            includeLocalVideos: true,
            withFiles: false,
            user,
            historyOfUser: user
        });
    }
    static removeUserHistoryBefore(user, beforeDate, t) {
        const query = {
            where: {
                userId: user.id
            },
            transaction: t
        };
        if (beforeDate) {
            query.where['updatedAt'] = {
                [sequelize_1.Op.lt]: beforeDate
            };
        }
        return UserVideoHistoryModel_1.destroy(query);
    }
    static removeOldHistory(beforeDate) {
        const query = {
            where: {
                updatedAt: {
                    [sequelize_1.Op.lt]: beforeDate
                }
            }
        };
        return UserVideoHistoryModel_1.destroy(query);
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], UserVideoHistoryModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], UserVideoHistoryModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.IsInt,
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserVideoHistoryModel.prototype, "currentTime", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserVideoHistoryModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], UserVideoHistoryModel.prototype, "Video", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserVideoHistoryModel.prototype, "userId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", user_1.UserModel)
], UserVideoHistoryModel.prototype, "User", void 0);
UserVideoHistoryModel = UserVideoHistoryModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'userVideoHistory',
        indexes: [
            {
                fields: ['userId', 'videoId'],
                unique: true
            },
            {
                fields: ['userId']
            },
            {
                fields: ['videoId']
            }
        ]
    })
], UserVideoHistoryModel);
exports.UserVideoHistoryModel = UserVideoHistoryModel;
