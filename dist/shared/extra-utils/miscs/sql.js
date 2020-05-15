"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
let sequelizes = {};
function getSequelize(internalServerNumber) {
    if (sequelizes[internalServerNumber])
        return sequelizes[internalServerNumber];
    const dbname = 'peertube_test' + internalServerNumber;
    const username = 'peertube';
    const password = 'peertube';
    const host = process.env.GITLAB_CI ? 'postgres' : 'localhost';
    const port = 5432;
    const seq = new sequelize_1.Sequelize(dbname, username, password, {
        dialect: 'postgres',
        host,
        port,
        logging: false
    });
    sequelizes[internalServerNumber] = seq;
    return seq;
}
function setActorField(internalServerNumber, to, field, value) {
    const seq = getSequelize(internalServerNumber);
    const options = { type: sequelize_1.QueryTypes.UPDATE };
    return seq.query(`UPDATE actor SET "${field}" = '${value}' WHERE url = '${to}'`, options);
}
exports.setActorField = setActorField;
function setVideoField(internalServerNumber, uuid, field, value) {
    const seq = getSequelize(internalServerNumber);
    const options = { type: sequelize_1.QueryTypes.UPDATE };
    return seq.query(`UPDATE video SET "${field}" = '${value}' WHERE uuid = '${uuid}'`, options);
}
exports.setVideoField = setVideoField;
function setPlaylistField(internalServerNumber, uuid, field, value) {
    const seq = getSequelize(internalServerNumber);
    const options = { type: sequelize_1.QueryTypes.UPDATE };
    return seq.query(`UPDATE "videoPlaylist" SET "${field}" = '${value}' WHERE uuid = '${uuid}'`, options);
}
exports.setPlaylistField = setPlaylistField;
function countVideoViewsOf(internalServerNumber, uuid) {
    return __awaiter(this, void 0, void 0, function* () {
        const seq = getSequelize(internalServerNumber);
        const query = `SELECT SUM("videoView"."views") AS "total" FROM "videoView" INNER JOIN "video" ON "video"."id" = "videoView"."videoId" WHERE "video"."uuid" = '${uuid}'`;
        const options = { type: sequelize_1.QueryTypes.SELECT };
        const [{ total }] = yield seq.query(query, options);
        if (!total)
            return 0;
        return parseInt(total + '', 10);
    });
}
exports.countVideoViewsOf = countVideoViewsOf;
function closeAllSequelize(servers) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const server of servers) {
            if (sequelizes[server.internalServerNumber]) {
                yield sequelizes[server.internalServerNumber].close();
                delete sequelizes[server.internalServerNumber];
            }
        }
    });
}
exports.closeAllSequelize = closeAllSequelize;
function setPluginVersion(internalServerNumber, pluginName, newVersion) {
    const seq = getSequelize(internalServerNumber);
    const options = { type: sequelize_1.QueryTypes.UPDATE };
    return seq.query(`UPDATE "plugin" SET "version" = '${newVersion}' WHERE "name" = '${pluginName}'`, options);
}
exports.setPluginVersion = setPluginVersion;
function setActorFollowScores(internalServerNumber, newScore) {
    const seq = getSequelize(internalServerNumber);
    const options = { type: sequelize_1.QueryTypes.UPDATE };
    return seq.query(`UPDATE "actorFollow" SET "score" = ${newScore}`, options);
}
exports.setActorFollowScores = setActorFollowScores;
