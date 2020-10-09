"use strict";
var userPremiumStoragePaymentModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPremiumStoragePaymentModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const premium_storage_plan_1 = require("./premium-storage-plan");
const user_1 = require("./account/user");
const logger_1 = require("@server/helpers/logger");
let userPremiumStoragePaymentModel = userPremiumStoragePaymentModel_1 = class userPremiumStoragePaymentModel extends sequelize_typescript_1.Model {
    static getStats() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const today = new Date();
                const lastMonth = new Date("last day of last month").getMonth();
                const payments = yield this.getAllActivePayments();
                const resp = {
                    activePayments: 0,
                    soldStorage: 0,
                    currentMonthIncome: 0,
                    lastMonthIncome: 0
                };
                for (var payment of payments) {
                    const paymentMonth = new Date(payment.dateFrom).getMonth();
                    resp.activePayments++;
                    resp.soldStorage = resp.soldStorage + parseInt(payment.quota.toString());
                    if (paymentMonth === today.getMonth()) {
                        resp.currentMonthIncome = resp.currentMonthIncome + parseFloat(payment.priceTube.toString());
                    }
                    if (paymentMonth === lastMonth) {
                        resp.lastMonthIncome = resp.lastMonthIncome + payment.priceTube;
                    }
                }
                return resp;
            }
            catch (err) {
                logger_1.logger.error('ICEICE some error ocurred at getStats', err);
                return err;
            }
        });
    }
    static getUserPayments(userId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const paymentsResponse = yield userPremiumStoragePaymentModel_1.findAll({
                include: [{
                        model: premium_storage_plan_1.PremiumStoragePlanModel.unscoped(),
                        required: true
                    }],
                where: { userId: userId },
                order: [['id', "DESC"]]
            });
            return paymentsResponse;
        });
    }
    static getUserActivePayment(userId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const paymentsResponse = yield userPremiumStoragePaymentModel_1.findAll({
                include: [{
                        model: premium_storage_plan_1.PremiumStoragePlanModel.unscoped(),
                        required: true
                    }],
                where: { userId: userId, active: true },
                order: [['id', 'DESC']]
            });
            return paymentsResponse;
        });
    }
    static getAllActivePayments() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const paymentsResponse = yield userPremiumStoragePaymentModel_1.findAll({ where: { active: true } });
            return paymentsResponse;
        });
    }
    static deactivateUserPayment(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const paymentsResponse = yield userPremiumStoragePaymentModel_1.update({ active: false }, { where: { id: id } });
            return paymentsResponse;
        });
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true }),
    tslib_1.__metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "id", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "userId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", user_1.UserModel)
], userPremiumStoragePaymentModel.prototype, "User", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => premium_storage_plan_1.PremiumStoragePlanModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "planId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => premium_storage_plan_1.PremiumStoragePlanModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", premium_storage_plan_1.PremiumStoragePlanModel)
], userPremiumStoragePaymentModel.prototype, "premiumStoragePlan", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DATE, allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "dateFrom", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DATE, allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "dateTo", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32, 8), allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "priceTube", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "quota", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "dailyQuota", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "duration", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.STRING, allowNull: false }),
    tslib_1.__metadata("design:type", String)
], userPremiumStoragePaymentModel.prototype, "payment_tx", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: false, defaultValue: true }),
    tslib_1.__metadata("design:type", Boolean)
], userPremiumStoragePaymentModel.prototype, "active", void 0);
userPremiumStoragePaymentModel = userPremiumStoragePaymentModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'userPremiumStoragePayment',
        indexes: [
            {
                fields: ['id'],
                unique: true
            }
        ]
    })
], userPremiumStoragePaymentModel);
exports.userPremiumStoragePaymentModel = userPremiumStoragePaymentModel;
