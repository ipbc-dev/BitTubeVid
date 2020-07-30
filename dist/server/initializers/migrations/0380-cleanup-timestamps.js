"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            yield utils.queryInterface.removeColumn('application', 'createdAt');
        }
        catch (_a) { }
        try {
            yield utils.queryInterface.removeColumn('application', 'updatedAt');
        }
        catch (_b) { }
        try {
            yield utils.queryInterface.removeColumn('videoView', 'updatedAt');
        }
        catch (_c) { }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
