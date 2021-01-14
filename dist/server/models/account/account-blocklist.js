"use strict";
var AccountBlocklistModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountBlocklistModel = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const actor_1 = require("../activitypub/actor");
const server_1 = require("../server/server");
const utils_1 = require("../utils");
const account_1 = require("./account");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_ACCOUNTS"] = "WITH_ACCOUNTS";
})(ScopeNames || (ScopeNames = {}));
let AccountBlocklistModel = AccountBlocklistModel_1 = class AccountBlocklistModel extends sequelize_typescript_1.Model {
    static isAccountMutedByMulti(accountIds, targetAccountId) {
        const query = {
            attributes: ['accountId', 'id'],
            where: {
                accountId: {
                    [sequelize_1.Op.in]: accountIds
                },
                targetAccountId
            },
            raw: true
        };
        return AccountBlocklistModel_1.unscoped()
            .findAll(query)
            .then(rows => {
            const result = {};
            for (const accountId of accountIds) {
                result[accountId] = !!rows.find(r => r.accountId === accountId);
            }
            return result;
        });
    }
    static loadByAccountAndTarget(accountId, targetAccountId) {
        const query = {
            where: {
                accountId,
                targetAccountId
            }
        };
        return AccountBlocklistModel_1.findOne(query);
    }
    static listForApi(parameters) {
        const { start, count, sort, search, accountId } = parameters;
        const query = {
            offset: start,
            limit: count,
            order: utils_1.getSort(sort)
        };
        const where = {
            accountId
        };
        if (search) {
            Object.assign(where, {
                [sequelize_1.Op.or]: [
                    utils_1.searchAttribute(search, '$BlockedAccount.name$'),
                    utils_1.searchAttribute(search, '$BlockedAccount.Actor.url$')
                ]
            });
        }
        Object.assign(query, { where });
        return AccountBlocklistModel_1
            .scope([ScopeNames.WITH_ACCOUNTS])
            .findAndCountAll(query)
            .then(({ rows, count }) => {
            return { total: count, data: rows };
        });
    }
    static listHandlesBlockedBy(accountIds) {
        const query = {
            attributes: ['id'],
            where: {
                accountId: {
                    [sequelize_1.Op.in]: accountIds
                }
            },
            include: [
                {
                    attributes: ['id'],
                    model: account_1.AccountModel.unscoped(),
                    required: true,
                    as: 'BlockedAccount',
                    include: [
                        {
                            attributes: ['preferredUsername'],
                            model: actor_1.ActorModel.unscoped(),
                            required: true,
                            include: [
                                {
                                    attributes: ['host'],
                                    model: server_1.ServerModel.unscoped(),
                                    required: true
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        return AccountBlocklistModel_1.findAll(query)
            .then(entries => entries.map(e => `${e.BlockedAccount.Actor.preferredUsername}@${e.BlockedAccount.Actor.Server.host}`));
    }
    toFormattedJSON() {
        return {
            byAccount: this.ByAccount.toFormattedJSON(),
            blockedAccount: this.BlockedAccount.toFormattedJSON(),
            createdAt: this.createdAt
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], AccountBlocklistModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], AccountBlocklistModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], AccountBlocklistModel.prototype, "accountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'accountId',
            allowNull: false
        },
        as: 'ByAccount',
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], AccountBlocklistModel.prototype, "ByAccount", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], AccountBlocklistModel.prototype, "targetAccountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'targetAccountId',
            allowNull: false
        },
        as: 'BlockedAccount',
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], AccountBlocklistModel.prototype, "BlockedAccount", void 0);
AccountBlocklistModel = AccountBlocklistModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.WITH_ACCOUNTS]: {
            include: [
                {
                    model: account_1.AccountModel,
                    required: true,
                    as: 'ByAccount'
                },
                {
                    model: account_1.AccountModel,
                    required: true,
                    as: 'BlockedAccount'
                }
            ]
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'accountBlocklist',
        indexes: [
            {
                fields: ['accountId', 'targetAccountId'],
                unique: true
            },
            {
                fields: ['targetAccountId']
            }
        ]
    })
], AccountBlocklistModel);
exports.AccountBlocklistModel = AccountBlocklistModel;
