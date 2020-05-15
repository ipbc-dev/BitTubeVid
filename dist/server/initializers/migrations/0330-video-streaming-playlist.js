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
const Sequelize = require("sequelize");
function up(utils) {
    return __awaiter(this, void 0, void 0, function* () {
        {
            const query = `
  CREATE TABLE IF NOT EXISTS "videoStreamingPlaylist"
(
  "id"                       SERIAL,
  "type"                     INTEGER                  NOT NULL,
  "playlistUrl"              VARCHAR(2000)            NOT NULL,
  "p2pMediaLoaderInfohashes" VARCHAR(255)[]           NOT NULL,
  "segmentsSha256Url"        VARCHAR(255)             NOT NULL,
  "videoId"                  INTEGER                  NOT NULL REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt"                TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt"                TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("id")
);`;
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.changeColumn('videoRedundancy', 'videoFileId', data);
        }
        {
            const query = 'ALTER TABLE "videoRedundancy" ADD COLUMN "videoStreamingPlaylistId" INTEGER NULL ' +
                'REFERENCES "videoStreamingPlaylist" ("id") ON DELETE CASCADE ON UPDATE CASCADE';
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
