"use strict";
var premiumStorageSlowPayer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.premiumStorageSlowPayer = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const user_1 = require("./account/user");
let premiumStorageSlowPayer = premiumStorageSlowPayer_1 = class premiumStorageSlowPayer extends sequelize_typescript_1.Model {
    static addSlowPayer(userId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield premiumStorageSlowPayer_1.create({ userId: userId });
        });
    }
    static deleteSlowPayer(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield premiumStorageSlowPayer_1.destroy({ where: { id: id } });
        });
    }
    static getAllSlowPayers() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield premiumStorageSlowPayer_1.findAll();
        });
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true }),
    tslib_1.__metadata("design:type", Number)
], premiumStorageSlowPayer.prototype, "id", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], premiumStorageSlowPayer.prototype, "userId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", user_1.UserModel)
], premiumStorageSlowPayer.prototype, "User", void 0);
premiumStorageSlowPayer = premiumStorageSlowPayer_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'premiumStorageSlowPayer',
        indexes: [
            {
                fields: ['id'],
                unique: true
            },
            {
                fields: ['userId'],
                unique: true
            }
        ]
    })
], premiumStorageSlowPayer);
exports.premiumStorageSlowPayer = premiumStorageSlowPayer;
