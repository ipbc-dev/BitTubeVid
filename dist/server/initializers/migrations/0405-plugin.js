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
function up(utils) {
    return __awaiter(this, void 0, void 0, function* () {
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
