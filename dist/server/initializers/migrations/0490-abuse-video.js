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
        const deletedVideo = {
            type: Sequelize.JSONB,
            allowNull: true
        };
        yield utils.queryInterface.addColumn('videoAbuse', 'deletedVideo', deletedVideo);
        yield utils.sequelize.query(`ALTER TABLE "videoAbuse" ALTER COLUMN "videoId" DROP NOT NULL;`);
        yield utils.sequelize.query(`ALTER TABLE "videoAbuse" DROP CONSTRAINT IF EXISTS "videoAbuse_videoId_fkey";`);
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
