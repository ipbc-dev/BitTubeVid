"use strict";
var ServerModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const servers_1 = require("../../helpers/custom-validators/servers");
const actor_1 = require("../activitypub/actor");
const utils_1 = require("../utils");
const server_blocklist_1 = require("./server-blocklist");
let ServerModel = ServerModel_1 = class ServerModel extends sequelize_typescript_1.Model {
    static load(id) {
        const query = {
            where: {
                id
            }
        };
        return ServerModel_1.findOne(query);
    }
    static loadByHost(host) {
        const query = {
            where: {
                host
            }
        };
        return ServerModel_1.findOne(query);
    }
    static loadOrCreateByHost(host) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let server = yield ServerModel_1.loadByHost(host);
            if (!server)
                server = yield ServerModel_1.create({ host });
            return server;
        });
    }
    isBlocked() {
        return this.BlockedByAccounts && this.BlockedByAccounts.length !== 0;
    }
    toFormattedJSON() {
        return {
            host: this.host
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('Host', value => utils_1.throwIfNotValid(value, servers_1.isHostValid, 'valid host')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], ServerModel.prototype, "host", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], ServerModel.prototype, "redundancyAllowed", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], ServerModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], ServerModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.HasMany(() => actor_1.ActorModel, {
        foreignKey: {
            name: 'serverId',
            allowNull: true
        },
        onDelete: 'CASCADE',
        hooks: true
    }),
    tslib_1.__metadata("design:type", Array)
], ServerModel.prototype, "Actors", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.HasMany(() => server_blocklist_1.ServerBlocklistModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", Array)
], ServerModel.prototype, "BlockedByAccounts", void 0);
ServerModel = ServerModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'server',
        indexes: [
            {
                fields: ['host'],
                unique: true
            }
        ]
    })
], ServerModel);
exports.ServerModel = ServerModel;
