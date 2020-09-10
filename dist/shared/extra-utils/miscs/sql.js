"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeAllSequelize = exports.setActorFollowScores = exports.setPluginVersion = exports.countVideoViewsOf = exports.setActorField = exports.setPlaylistField = exports.setVideoField = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelizes = {};
function getSequelize(internalServerNumber) {
    if (sequelizes[internalServerNumber])
        return sequelizes[internalServerNumber];
    const dbname = 'peertube_test' + internalServerNumber;
    const username = 'peertube';
    const password = 'peertube';
    const host = 'localhost';
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const seq = getSequelize(internalServerNumber);
        const query = 'SELECT SUM("videoView"."views") AS "total" FROM "videoView" ' +
            `INNER JOIN "video" ON "video"."id" = "videoView"."videoId" WHERE "video"."uuid" = '${uuid}'`;
        const options = { type: sequelize_1.QueryTypes.SELECT };
        const [{ total }] = yield seq.query(query, options);
        if (!total)
            return 0;
        return parseInt(total + '', 10);
    });
}
exports.countVideoViewsOf = countVideoViewsOf;
function closeAllSequelize(servers) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
