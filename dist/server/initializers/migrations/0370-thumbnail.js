"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = `
CREATE TABLE IF NOT EXISTS "thumbnail"
(
  "id"              SERIAL,
  "filename"        VARCHAR(255)             NOT NULL,
  "height"          INTEGER DEFAULT NULL,
  "width"           INTEGER DEFAULT NULL,
  "type"            INTEGER                  NOT NULL,
  "fileUrl"             VARCHAR(255),
  "videoId"         INTEGER REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "videoPlaylistId" INTEGER REFERENCES "videoPlaylist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("id")
);`;
            yield utils.sequelize.query(query);
        }
        {
            const query = 'INSERT INTO "thumbnail" ("filename", "type", "videoId", "height", "width", "createdAt", "updatedAt")' +
                'SELECT uuid || \'.jpg\', 1, id, 110, 200, NOW(), NOW() FROM "video"';
            yield utils.sequelize.query(query);
        }
        {
            const query = 'INSERT INTO "thumbnail" ("filename", "type", "videoId", "height", "width", "createdAt", "updatedAt")' +
                'SELECT uuid || \'.jpg\', 2, id, 315, 560, NOW(), NOW() FROM "video"';
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
