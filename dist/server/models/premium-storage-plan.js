"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var PremiumStoragePlanModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
let PremiumStoragePlanModel = PremiumStoragePlanModel_1 = class PremiumStoragePlanModel extends sequelize_typescript_1.Model {
    static getPlans() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PremiumStoragePlanModel_1.findAll({
                order: [['quota', "ASC"], ['duration', "ASC"]]
            });
        });
    }
    static addPlan(name, quota, dailyQuota, duration, priceTube, active) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PremiumStoragePlanModel_1.create({ name: name, quota: quota, dailyQuota: dailyQuota, duration: duration, priceTube: priceTube, active: active });
        });
    }
    static updatePlan(id, name, quota, dailyQuota, duration, priceTube, active) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PremiumStoragePlanModel_1.update({ name: name, quota: quota, dailyQuota: dailyQuota, duration: duration, priceTube: priceTube, active: active }, { where: { id: id } });
        });
    }
    static removePlan(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PremiumStoragePlanModel_1.destroy({ where: { id: id } });
        });
    }
};
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true }),
    __metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.STRING(50), allowNull: false, unique: true }),
    __metadata("design:type", String)
], PremiumStoragePlanModel.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    __metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "quota", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    __metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "dailyQuota", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32, 8), allowNull: false }),
    __metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "priceTube", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    __metadata("design:type", Number)
], PremiumStoragePlanModel.prototype, "duration", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: false, defaultValue: true }),
    __metadata("design:type", Boolean)
], PremiumStoragePlanModel.prototype, "active", void 0);
PremiumStoragePlanModel = PremiumStoragePlanModel_1 = __decorate([
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
