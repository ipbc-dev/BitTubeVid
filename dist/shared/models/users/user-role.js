"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasUserRight = exports.USER_ROLE_LABELS = exports.UserRole = void 0;
const user_right_enum_1 = require("./user-right.enum");
var UserRole;
(function (UserRole) {
    UserRole[UserRole["ADMINISTRATOR"] = 0] = "ADMINISTRATOR";
    UserRole[UserRole["MODERATOR"] = 1] = "MODERATOR";
    UserRole[UserRole["USER"] = 2] = "USER";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
exports.USER_ROLE_LABELS = {
    [UserRole.USER]: 'User',
    [UserRole.MODERATOR]: 'Moderator',
    [UserRole.ADMINISTRATOR]: 'Administrator'
};
const userRoleRights = {
    [UserRole.ADMINISTRATOR]: [
        user_right_enum_1.UserRight.ALL
    ],
    [UserRole.MODERATOR]: [
        user_right_enum_1.UserRight.MANAGE_VIDEO_BLACKLIST,
        user_right_enum_1.UserRight.MANAGE_VIDEO_ABUSES,
        user_right_enum_1.UserRight.REMOVE_ANY_VIDEO,
        user_right_enum_1.UserRight.REMOVE_ANY_VIDEO_CHANNEL,
        user_right_enum_1.UserRight.REMOVE_ANY_VIDEO_PLAYLIST,
        user_right_enum_1.UserRight.REMOVE_ANY_VIDEO_COMMENT,
        user_right_enum_1.UserRight.UPDATE_ANY_VIDEO,
        user_right_enum_1.UserRight.SEE_ALL_VIDEOS,
        user_right_enum_1.UserRight.MANAGE_ACCOUNTS_BLOCKLIST,
        user_right_enum_1.UserRight.MANAGE_SERVERS_BLOCKLIST,
        user_right_enum_1.UserRight.MANAGE_USERS
    ],
    [UserRole.USER]: []
};
function hasUserRight(userRole, userRight) {
    const userRights = userRoleRights[userRole];
    return userRights.includes(user_right_enum_1.UserRight.ALL) || userRights.includes(userRight);
}
exports.hasUserRight = hasUserRight;
