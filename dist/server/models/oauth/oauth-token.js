"use strict";
var OAuthTokenModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthTokenModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const logger_1 = require("../../helpers/logger");
const user_1 = require("../account/user");
const oauth_client_1 = require("./oauth-client");
const account_1 = require("../account/account");
const actor_1 = require("../activitypub/actor");
const oauth_model_1 = require("../../lib/oauth-model");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_USER"] = "WITH_USER";
})(ScopeNames || (ScopeNames = {}));
let OAuthTokenModel = OAuthTokenModel_1 = class OAuthTokenModel extends sequelize_typescript_1.Model {
    static removeTokenCache(token) {
        return oauth_model_1.clearCacheByToken(token.accessToken);
    }
    static loadByRefreshToken(refreshToken) {
        const query = {
            where: { refreshToken }
        };
        return OAuthTokenModel_1.findOne(query);
    }
    static getByRefreshTokenAndPopulateClient(refreshToken) {
        const query = {
            where: {
                refreshToken
            },
            include: [oauth_client_1.OAuthClientModel]
        };
        return OAuthTokenModel_1.scope(ScopeNames.WITH_USER)
            .findOne(query)
            .then(token => {
            if (!token)
                return null;
            return {
                refreshToken: token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                client: {
                    id: token.oAuthClientId
                },
                user: token.User,
                token
            };
        })
            .catch(err => {
            logger_1.logger.error('getRefreshToken error.', { err });
            throw err;
        });
    }
    static getByTokenAndPopulateUser(bearerToken) {
        const query = {
            where: {
                accessToken: bearerToken
            }
        };
        return OAuthTokenModel_1.scope(ScopeNames.WITH_USER)
            .findOne(query)
            .then(token => {
            if (!token)
                return null;
            return Object.assign(token, { user: token.User });
        });
    }
    static getByRefreshTokenAndPopulateUser(refreshToken) {
        const query = {
            where: {
                refreshToken
            }
        };
        return OAuthTokenModel_1.scope(ScopeNames.WITH_USER)
            .findOne(query)
            .then(token => {
            if (!token)
                return undefined;
            return Object.assign(token, { user: token.User });
        });
    }
    static deleteUserToken(userId, t) {
        const query = {
            where: {
                userId
            },
            transaction: t
        };
        return OAuthTokenModel_1.destroy(query);
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], OAuthTokenModel.prototype, "accessToken", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Date)
], OAuthTokenModel.prototype, "accessTokenExpiresAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], OAuthTokenModel.prototype, "refreshToken", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Date)
], OAuthTokenModel.prototype, "refreshTokenExpiresAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], OAuthTokenModel.prototype, "authName", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], OAuthTokenModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], OAuthTokenModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], OAuthTokenModel.prototype, "userId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", user_1.UserModel)
], OAuthTokenModel.prototype, "User", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => oauth_client_1.OAuthClientModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], OAuthTokenModel.prototype, "oAuthClientId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => oauth_client_1.OAuthClientModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", Array)
], OAuthTokenModel.prototype, "OAuthClients", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AfterUpdate,
    sequelize_typescript_1.AfterDestroy,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [OAuthTokenModel]),
    tslib_1.__metadata("design:returntype", void 0)
], OAuthTokenModel, "removeTokenCache", null);
OAuthTokenModel = OAuthTokenModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.WITH_USER]: {
            include: [
                {
                    model: user_1.UserModel.unscoped(),
                    required: true,
                    include: [
                        {
                            attributes: ['id'],
                            model: account_1.AccountModel.unscoped(),
                            required: true,
                            include: [
                                {
                                    attributes: ['id', 'url'],
                                    model: actor_1.ActorModel.unscoped(),
                                    required: true
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'oAuthToken',
        indexes: [
            {
                fields: ['refreshToken'],
                unique: true
            },
            {
                fields: ['accessToken'],
                unique: true
            },
            {
                fields: ['userId']
            },
            {
                fields: ['oAuthClientId']
            }
        ]
    })
], OAuthTokenModel);
exports.OAuthTokenModel = OAuthTokenModel;
