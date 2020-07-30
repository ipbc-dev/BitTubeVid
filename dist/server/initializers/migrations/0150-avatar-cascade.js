"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.queryInterface.removeConstraint('actor', 'actor_avatarId_fkey');
        yield utils.queryInterface.addConstraint('actor', ['avatarId'], {
            type: 'foreign key',
            references: {
                table: 'avatar',
                field: 'id'
            },
            onDelete: 'set null',
            onUpdate: 'CASCADE'
        });
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
