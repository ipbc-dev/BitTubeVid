"use strict";
var ServerBlocklistModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerBlocklistModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const account_1 = require("../account/account");
const server_1 = require("./server");
const utils_1 = require("../utils");
const sequelize_1 = require("sequelize");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_ACCOUNT"] = "WITH_ACCOUNT";
    ScopeNames["WITH_SERVER"] = "WITH_SERVER";
})(ScopeNames || (ScopeNames = {}));
let ServerBlocklistModel = ServerBlocklistModel_1 = class ServerBlocklistModel extends sequelize_typescript_1.Model {
    static isServerMutedByMulti(accountIds, targetServerId) {
        const query = {
            attributes: ['accountId', 'id'],
            where: {
                accountId: {
                    [sequelize_1.Op.in]: accountIds
                },
                targetServerId
            },
            raw: true
        };
        return ServerBlocklistModel_1.unscoped()
            .findAll(query)
            .then(rows => {
            const result = {};
            for (const accountId of accountIds) {
                result[accountId] = !!rows.find(r => r.accountId === accountId);
            }
            return result;
        });
    }
    static loadByAccountAndHost(accountId, host) {
        const query = {
            where: {
                accountId
            },
            include: [
                {
                    model: server_1.ServerModel,
                    where: {
                        host
                    },
                    required: true
                }
            ]
        };
        return ServerBlocklistModel_1.findOne(query);
    }
    static listHostsBlockedBy(accountIds) {
        const query = {
            attributes: [],
            where: {
                accountId: {
                    [sequelize_1.Op.in]: accountIds
                }
            },
            include: [
                {
                    attributes: ['host'],
                    model: server_1.ServerModel.unscoped(),
                    required: true
                }
            ]
        };
        return ServerBlocklistModel_1.findAll(query)
            .then(entries => entries.map(e => e.BlockedServer.host));
    }
    static listForApi(parameters) {
        const { start, count, sort, search, accountId } = parameters;
        const query = {
            offset: start,
            limit: count,
            order: utils_1.getSort(sort),
            where: Object.assign({ accountId }, utils_1.searchAttribute(search, '$BlockedServer.host$'))
        };
        return ServerBlocklistModel_1
            .scope([ScopeNames.WITH_ACCOUNT, ScopeNames.WITH_SERVER])
            .findAndCountAll(query)
            .then(({ rows, count }) => {
            return { total: count, data: rows };
        });
    }
    toFormattedJSON() {
        return {
            byAccount: this.ByAccount.toFormattedJSON(),
            blockedServer: this.BlockedServer.toFormattedJSON(),
            createdAt: this.createdAt
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], ServerBlocklistModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], ServerBlocklistModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], ServerBlocklistModel.prototype, "accountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'accountId',
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], ServerBlocklistModel.prototype, "ByAccount", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => server_1.ServerModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], ServerBlocklistModel.prototype, "targetServerId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => server_1.ServerModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", server_1.ServerModel)
], ServerBlocklistModel.prototype, "BlockedServer", void 0);
ServerBlocklistModel = ServerBlocklistModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.WITH_ACCOUNT]: {
            include: [
                {
                    model: account_1.AccountModel,
                    required: true
                }
            ]
        },
        [ScopeNames.WITH_SERVER]: {
            include: [
                {
                    model: server_1.ServerModel,
                    required: true
                }
            ]
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'serverBlocklist',
        indexes: [
            {
                fields: ['accountId', 'targetServerId'],
                unique: true
            },
            {
                fields: ['targetServerId']
            }
        ]
    })
], ServerBlocklistModel);
exports.ServerBlocklistModel = ServerBlocklistModel;
