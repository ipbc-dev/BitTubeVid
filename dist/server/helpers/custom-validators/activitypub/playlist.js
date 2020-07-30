"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlaylistElementObjectValid = exports.isPlaylistObjectValid = void 0;
const misc_1 = require("../misc");
const validator_1 = require("validator");
const misc_2 = require("./misc");
function isPlaylistObjectValid(object) {
    return misc_1.exists(object) &&
        object.type === 'Playlist' &&
        validator_1.default.isInt(object.totalItems + '') &&
        misc_1.isDateValid(object.published) &&
        misc_1.isDateValid(object.updated);
}
exports.isPlaylistObjectValid = isPlaylistObjectValid;
function isPlaylistElementObjectValid(object) {
    return misc_1.exists(object) &&
        object.type === 'PlaylistElement' &&
        validator_1.default.isInt(object.position + '') &&
        misc_2.isActivityPubUrlValid(object.url);
}
exports.isPlaylistElementObjectValid = isPlaylistElementObjectValid;
