"use strict";
var PremiumStoragePlanModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PremiumStoragePlanModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
let PremiumStoragePlanModel = PremiumStoragePlanModel_1 = class PremiumStoragePlanModel extends sequelize_typescript_1.Model {
    static getPlans() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield PremiumStoragePlanModel_1.findAll({
                order: [['quota', "ASC"], ['duration', "ASC"], ['expiration', "ASC"]]
            });
        });
    }
    static addPlan(name, quota, dailyQuota, duration, expiration, priceTube, active, tubePayId, tubePaySecret, tubePayOwnerContentName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield PremiumStoragePlanModel_1.create({ name: name, quota: quota, dailyQuota: dailyQuota, duration: duration, expiration: expiration, priceTube: priceTube, active: active, tubePayId: tubePayId, tubePaySecret: tubePaySecret, tubePayOwnerContentName: tubePayOwnerContentName });
        });
    }
    static updatePlan(id, name, quota, dailyQuota, duration, expiration, priceTube, active) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield PremiumStoragePlanModel_1.update({ name: name, quota: quota, dailyQuota: dailyQuota, duration: duration, expiration: expiration, priceTube: priceTube, active: active }, { where: { id: id } });
        });
    }
    static removePlan(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield PremiumStoragePlanModel_1.destroy({ where: { id: id } });
        });
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true }),
    tslib_1.__metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "id", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.STRING(50), allowNull: false, unique: true }),
    tslib_1.__metadata("design:type", String)
], PremiumStoragePlanModel.prototype, "name", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "quota", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "dailyQuota", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32, 8), allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "priceTube", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "duration", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    tslib_1.__metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "expiration", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: false, defaultValue: true }),
    tslib_1.__metadata("design:type", Boolean)
], PremiumStoragePlanModel.prototype, "active", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.STRING(15), allowNull: false, unique: true }),
    tslib_1.__metadata("design:type", String)
], PremiumStoragePlanModel.prototype, "tubePayId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.STRING, allowNull: false, unique: true }),
    tslib_1.__metadata("design:type", String)
], PremiumStoragePlanModel.prototype, "tubePaySecret", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.STRING, allowNull: false }),
    tslib_1.__metadata("design:type", String)
], PremiumStoragePlanModel.prototype, "tubePayOwnerContentName", void 0);
PremiumStoragePlanModel = PremiumStoragePlanModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'premiumStoragePlan',
        indexes: [
            {
                fields: ['id'],
                unique: true
            },
            {
                fields: ['name'],
                unique: true
            }
        ]
    })
], PremiumStoragePlanModel);
exports.PremiumStoragePlanModel = PremiumStoragePlanModel;
