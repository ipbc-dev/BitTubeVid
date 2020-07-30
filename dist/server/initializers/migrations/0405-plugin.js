"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = `
CREATE TABLE IF NOT EXISTS "plugin"
(
  "id"             SERIAL,
  "name"           VARCHAR(255)             NOT NULL,
  "type"           INTEGER                  NOT NULL,
  "version"        VARCHAR(255)             NOT NULL,
  "latestVersion"  VARCHAR(255),
  "enabled"        BOOLEAN                  NOT NULL,
  "uninstalled"    BOOLEAN                  NOT NULL,
  "peertubeEngine" VARCHAR(255)             NOT NULL,
  "description"    VARCHAR(255),
  "homepage"       VARCHAR(255)             NOT NULL,
  "settings"       JSONB,
  "storage"        JSONB,
  "createdAt"      TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt"      TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("id")
);`;
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
