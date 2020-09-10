"use strict";
var AbuseMessageModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbuseMessageModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const abuses_1 = require("@server/helpers/custom-validators/abuses");
const account_1 = require("../account/account");
const utils_1 = require("../utils");
const abuse_1 = require("./abuse");
let AbuseMessageModel = AbuseMessageModel_1 = class AbuseMessageModel extends sequelize_typescript_1.Model {
    static listForApi(abuseId) {
        const options = {
            where: { abuseId },
            order: utils_1.getSort('createdAt'),
            include: [
                {
                    model: account_1.AccountModel.scope(account_1.ScopeNames.SUMMARY),
                    required: false
                }
            ]
        };
        return AbuseMessageModel_1.findAndCountAll(options)
            .then(({ rows, count }) => ({ data: rows, total: count }));
    }
    static loadByIdAndAbuseId(messageId, abuseId) {
        return AbuseMessageModel_1.findOne({
            where: {
                id: messageId,
                abuseId
            }
        });
    }
    toFormattedJSON() {
        const account = this.Account
            ? this.Account.toFormattedSummaryJSON()
            : null;
        return {
            id: this.id,
            createdAt: this.createdAt,
            byModerator: this.byModerator,
            message: this.message,
            account
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('AbuseMessage', value => utils_1.throwIfNotValid(value, abuses_1.isAbuseMessageValid, 'message')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    tslib_1.__metadata("design:type", String)
], AbuseMessageModel.prototype, "message", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], AbuseMessageModel.prototype, "byModerator", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], AbuseMessageModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], AbuseMessageModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], AbuseMessageModel.prototype, "accountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'accountId',
            allowNull: true
        },
        onDelete: 'set null'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], AbuseMessageModel.prototype, "Account", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => abuse_1.AbuseModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], AbuseMessageModel.prototype, "abuseId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => abuse_1.AbuseModel, {
        foreignKey: {
            name: 'abuseId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", abuse_1.AbuseModel)
], AbuseMessageModel.prototype, "Abuse", void 0);
AbuseMessageModel = AbuseMessageModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'abuseMessage',
        indexes: [
            {
                fields: ['abuseId']
            },
            {
                fields: ['accountId']
            }
        ]
    })
], AbuseMessageModel);
exports.AbuseMessageModel = AbuseMessageModel;
