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
var ServerModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
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
        return __awaiter(this, void 0, void 0, function* () {
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
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('Host', value => utils_1.throwIfNotValid(value, servers_1.isHostValid, 'valid host')),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ServerModel.prototype, "host", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], ServerModel.prototype, "redundancyAllowed", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], ServerModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], ServerModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => actor_1.ActorModel, {
        foreignKey: {
            name: 'serverId',
            allowNull: true
        },
        onDelete: 'CASCADE',
        hooks: true
    }),
    __metadata("design:type", Array)
], ServerModel.prototype, "Actors", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => server_blocklist_1.ServerBlocklistModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", Array)
], ServerModel.prototype, "BlockedByAccounts", void 0);
ServerModel = ServerModel_1 = __decorate([
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
