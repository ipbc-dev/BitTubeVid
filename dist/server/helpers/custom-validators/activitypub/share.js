"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isShareActivityValid = void 0;
const misc_1 = require("./misc");
function isShareActivityValid(activity) {
    return misc_1.isBaseActivityValid(activity, 'Announce') &&
        misc_1.isObjectValid(activity.object);
}
exports.isShareActivityValid = isShareActivityValid;
