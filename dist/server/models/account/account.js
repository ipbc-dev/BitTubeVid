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
var AccountModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const accounts_1 = require("../../helpers/custom-validators/accounts");
const send_1 = require("../../lib/activitypub/send");
const actor_1 = require("../activitypub/actor");
const application_1 = require("../application/application");
const server_1 = require("../server/server");
const utils_1 = require("../utils");
const video_channel_1 = require("../video/video-channel");
const video_comment_1 = require("../video/video-comment");
const user_1 = require("./user");
const avatar_1 = require("../avatar/avatar");
const video_playlist_1 = require("../video/video-playlist");
const constants_1 = require("../../initializers/constants");
const sequelize_1 = require("sequelize");
const account_blocklist_1 = require("./account-blocklist");
const server_blocklist_1 = require("../server/server-blocklist");
const actor_follow_1 = require("../activitypub/actor-follow");
const Bluebird = require("bluebird");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["SUMMARY"] = "SUMMARY";
})(ScopeNames = exports.ScopeNames || (exports.ScopeNames = {}));
let AccountModel = AccountModel_1 = class AccountModel extends sequelize_typescript_1.Model {
    static sendDeleteIfOwned(instance, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!instance.Actor) {
                instance.Actor = yield instance.$get('Actor', { transaction: options.transaction });
            }
            yield actor_follow_1.ActorFollowModel.removeFollowsOf(instance.Actor.id, options.transaction);
            if (instance.isOwned()) {
                return send_1.sendDeleteActor(instance.Actor, options.transaction);
            }
            return undefined;
        });
    }
    static load(id, transaction) {
        return AccountModel_1.findByPk(id, { transaction });
    }
    static loadByNameWithHost(nameWithHost) {
        const [accountName, host] = nameWithHost.split('@');
        if (!host || host === constants_1.WEBSERVER.HOST)
            return AccountModel_1.loadLocalByName(accountName);
        return AccountModel_1.loadByNameAndHost(accountName, host);
    }
    static loadLocalByName(name) {
        if (name === constants_1.SERVER_ACTOR_NAME && AccountModel_1.cache[name]) {
            return Bluebird.resolve(AccountModel_1.cache[name]);
        }
        const query = {
            where: {
                [sequelize_1.Op.or]: [
                    {
                        userId: {
                            [sequelize_1.Op.ne]: null
                        }
                    },
                    {
                        applicationId: {
                            [sequelize_1.Op.ne]: null
                        }
                    }
                ]
            },
            include: [
                {
                    model: actor_1.ActorModel,
                    required: true,
                    where: {
                        preferredUsername: name
                    }
                }
            ]
        };
        return AccountModel_1.findOne(query)
            .then(account => {
            if (name === constants_1.SERVER_ACTOR_NAME) {
                AccountModel_1.cache[name] = account;
            }
            return account;
        });
    }
    static loadByNameAndHost(name, host) {
        const query = {
            include: [
                {
                    model: actor_1.ActorModel,
                    required: true,
                    where: {
                        preferredUsername: name
                    },
                    include: [
                        {
                            model: server_1.ServerModel,
                            required: true,
                            where: {
                                host
                            }
                        }
                    ]
                }
            ]
        };
        return AccountModel_1.findOne(query);
    }
    static loadByUrl(url, transaction) {
        const query = {
            include: [
                {
                    model: actor_1.ActorModel,
                    required: true,
                    where: {
                        url
                    }
                }
            ],
            transaction
        };
        return AccountModel_1.findOne(query);
    }
    static listForApi(start, count, sort) {
        const query = {
            offset: start,
            limit: count,
            order: utils_1.getSort(sort)
        };
        return AccountModel_1.findAndCountAll(query)
            .then(({ rows, count }) => {
            return {
                data: rows,
                total: count
            };
        });
    }
    static listLocalsForSitemap(sort) {
        const query = {
            attributes: [],
            offset: 0,
            order: utils_1.getSort(sort),
            include: [
                {
                    attributes: ['preferredUsername', 'serverId'],
                    model: actor_1.ActorModel.unscoped(),
                    where: {
                        serverId: null
                    }
                }
            ]
        };
        return AccountModel_1
            .unscoped()
            .findAll(query);
    }
    toFormattedJSON() {
        const actor = this.Actor.toFormattedJSON();
        const account = {
            id: this.id,
            displayName: this.getDisplayName(),
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            userId: this.userId ? this.userId : undefined
        };
        return Object.assign(actor, account);
    }
    toFormattedSummaryJSON() {
        const actor = this.Actor.toFormattedSummaryJSON();
        return {
            id: this.id,
            name: actor.name,
            displayName: this.getDisplayName(),
            url: actor.url,
            host: actor.host,
            avatar: actor.avatar
        };
    }
    toActivityPubObject() {
        const obj = this.Actor.toActivityPubObject(this.name);
        return Object.assign(obj, {
            summary: this.description
        });
    }
    isOwned() {
        return this.Actor.isOwned();
    }
    isOutdated() {
        return this.Actor.isOutdated();
    }
    getDisplayName() {
        return this.name;
    }
    isBlocked() {
        return this.BlockedAccounts && this.BlockedAccounts.length !== 0;
    }
};
AccountModel.cache = {};
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], AccountModel.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('AccountDescription', value => utils_1.throwIfNotValid(value, accounts_1.isAccountDescriptionValid, 'description', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.USERS.DESCRIPTION.max)),
    __metadata("design:type", String)
], AccountModel.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], AccountModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], AccountModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => actor_1.ActorModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], AccountModel.prototype, "actorId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => actor_1.ActorModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", actor_1.ActorModel)
], AccountModel.prototype, "Actor", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], AccountModel.prototype, "userId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", user_1.UserModel)
], AccountModel.prototype, "User", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => application_1.ApplicationModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], AccountModel.prototype, "applicationId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => application_1.ApplicationModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", application_1.ApplicationModel)
], AccountModel.prototype, "Application", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_channel_1.VideoChannelModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade',
        hooks: true
    }),
    __metadata("design:type", Array)
], AccountModel.prototype, "VideoChannels", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_playlist_1.VideoPlaylistModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade',
        hooks: true
    }),
    __metadata("design:type", Array)
], AccountModel.prototype, "VideoPlaylists", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_comment_1.VideoCommentModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade',
        hooks: true
    }),
    __metadata("design:type", Array)
], AccountModel.prototype, "VideoComments", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => account_blocklist_1.AccountBlocklistModel, {
        foreignKey: {
            name: 'targetAccountId',
            allowNull: false
        },
        as: 'BlockedAccounts',
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", Array)
], AccountModel.prototype, "BlockedAccounts", void 0);
__decorate([
    sequelize_typescript_1.BeforeDestroy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AccountModel, Object]),
    __metadata("design:returntype", Promise)
], AccountModel, "sendDeleteIfOwned", null);
AccountModel = AccountModel_1 = __decorate([
    sequelize_typescript_1.DefaultScope(() => ({
        include: [
            {
                model: actor_1.ActorModel,
                required: true
            }
        ]
    })),
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.SUMMARY]: (options = {}) => {
            const whereActor = options.whereActor || undefined;
            const serverInclude = {
                attributes: ['host'],
                model: server_1.ServerModel.unscoped(),
                required: false
            };
            const query = {
                attributes: ['id', 'name'],
                include: [
                    {
                        attributes: ['id', 'preferredUsername', 'url', 'serverId', 'avatarId'],
                        model: actor_1.ActorModel.unscoped(),
                        required: true,
                        where: whereActor,
                        include: [
                            serverInclude,
                            {
                                model: avatar_1.AvatarModel.unscoped(),
                                required: false
                            }
                        ]
                    }
                ]
            };
            if (options.withAccountBlockerIds) {
                query.include.push({
                    attributes: ['id'],
                    model: account_blocklist_1.AccountBlocklistModel.unscoped(),
                    as: 'BlockedAccounts',
                    required: false,
                    where: {
                        accountId: {
                            [sequelize_1.Op.in]: options.withAccountBlockerIds
                        }
                    }
                });
                serverInclude.include = [
                    {
                        attributes: ['id'],
                        model: server_blocklist_1.ServerBlocklistModel.unscoped(),
                        required: false,
                        where: {
                            accountId: {
                                [sequelize_1.Op.in]: options.withAccountBlockerIds
                            }
                        }
                    }
                ];
            }
            return query;
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'account',
        indexes: [
            {
                fields: ['actorId'],
                unique: true
            },
            {
                fields: ['applicationId']
            },
            {
                fields: ['userId']
            }
        ]
    })
], AccountModel);
exports.AccountModel = AccountModel;
