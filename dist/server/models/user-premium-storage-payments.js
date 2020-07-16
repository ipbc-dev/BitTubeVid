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
var userPremiumStoragePaymentModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const premium_storage_plan_1 = require("./premium-storage-plan");
const user_1 = require("./account/user");
let userPremiumStoragePaymentModel = userPremiumStoragePaymentModel_1 = class userPremiumStoragePaymentModel extends sequelize_typescript_1.Model {
    static getUserPayments(userId) {
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
            const paymentsResponse = yield userPremiumStoragePaymentModel_1.findAll({ where: { active: true } });
            return paymentsResponse;
        });
    }
    static deactivateUserPayment(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const paymentsResponse = yield userPremiumStoragePaymentModel_1.update({ active: false }, { where: { id: id } });
            return paymentsResponse;
        });
    }
};
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true }),
    __metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "userId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", user_1.UserModel)
], userPremiumStoragePaymentModel.prototype, "User", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => premium_storage_plan_1.PremiumStoragePlanModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "planId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => premium_storage_plan_1.PremiumStoragePlanModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", premium_storage_plan_1.PremiumStoragePlanModel)
], userPremiumStoragePaymentModel.prototype, "premiumStoragePlan", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DATE, allowNull: false }),
    __metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "dateFrom", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DATE, allowNull: false }),
    __metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "dateTo", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32, 8), allowNull: false }),
    __metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "priceTube", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    __metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "quota", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    __metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "dailyQuota", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.DECIMAL(32), allowNull: false }),
    __metadata("design:type", Number)
], userPremiumStoragePaymentModel.prototype, "duration", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: false, defaultValue: true }),
    __metadata("design:type", Boolean)
], userPremiumStoragePaymentModel.prototype, "active", void 0);
userPremiumStoragePaymentModel = userPremiumStoragePaymentModel_1 = __decorate([
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
