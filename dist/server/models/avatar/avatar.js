"use strict";
var AvatarModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarModel = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const sequelize_typescript_1 = require("sequelize-typescript");
const constants_1 = require("../../initializers/constants");
const logger_1 = require("../../helpers/logger");
const fs_extra_1 = require("fs-extra");
const config_1 = require("../../initializers/config");
const utils_1 = require("../utils");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
let AvatarModel = AvatarModel_1 = class AvatarModel extends sequelize_typescript_1.Model {
    static removeFilesAndSendDelete(instance) {
        logger_1.logger.info('Removing avatar file %s.', instance.filename);
        instance.removeAvatar()
            .catch(err => logger_1.logger.error('Cannot remove avatar file %s.', instance.filename, err));
    }
    static loadByName(filename) {
        const query = {
            where: {
                filename
            }
        };
        return AvatarModel_1.findOne(query);
    }
    toFormattedJSON() {
        return {
            path: this.getStaticPath(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
    getStaticPath() {
        return path_1.join(constants_1.LAZY_STATIC_PATHS.AVATARS, this.filename);
    }
    getPath() {
        return path_1.join(config_1.CONFIG.STORAGE.AVATARS_DIR, this.filename);
    }
    removeAvatar() {
        const avatarPath = path_1.join(config_1.CONFIG.STORAGE.AVATARS_DIR, this.filename);
        return fs_extra_1.remove(avatarPath);
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], AvatarModel.prototype, "filename", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Is('AvatarFileUrl', value => utils_1.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'fileUrl', true)),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], AvatarModel.prototype, "fileUrl", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], AvatarModel.prototype, "onDisk", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], AvatarModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], AvatarModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AfterDestroy,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [AvatarModel]),
    tslib_1.__metadata("design:returntype", void 0)
], AvatarModel, "removeFilesAndSendDelete", null);
AvatarModel = AvatarModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'avatar',
        indexes: [
            {
                fields: ['filename'],
                unique: true
            }
        ]
    })
], AvatarModel);
exports.AvatarModel = AvatarModel;
