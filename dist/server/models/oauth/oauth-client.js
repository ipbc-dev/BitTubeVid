"use strict";
var OAuthClientModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthClientModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const oauth_token_1 = require("./oauth-token");
let OAuthClientModel = OAuthClientModel_1 = class OAuthClientModel extends sequelize_typescript_1.Model {
    static countTotal() {
        return OAuthClientModel_1.count();
    }
    static loadFirstClient() {
        return OAuthClientModel_1.findOne();
    }
    static getByIdAndSecret(clientId, clientSecret) {
        const query = {
            where: {
                clientId: clientId,
                clientSecret: clientSecret
            }
        };
        return OAuthClientModel_1.findOne(query);
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], OAuthClientModel.prototype, "clientId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], OAuthClientModel.prototype, "clientSecret", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING)),
    tslib_1.__metadata("design:type", Array)
], OAuthClientModel.prototype, "grants", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING)),
    tslib_1.__metadata("design:type", Array)
], OAuthClientModel.prototype, "redirectUris", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], OAuthClientModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], OAuthClientModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.HasMany(() => oauth_token_1.OAuthTokenModel, {
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", Array)
], OAuthClientModel.prototype, "OAuthTokens", void 0);
OAuthClientModel = OAuthClientModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'oAuthClient',
        indexes: [
            {
                fields: ['clientId'],
                unique: true
            },
            {
                fields: ['clientId', 'clientSecret'],
                unique: true
            }
        ]
    })
], OAuthClientModel);
exports.OAuthClientModel = OAuthClientModel;
