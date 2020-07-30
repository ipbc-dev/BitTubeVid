"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAvatarFile = exports.isNoWelcomeModal = exports.isNoInstanceConfigWarningModal = exports.isUserDescriptionValid = exports.isUserDisplayNameValid = exports.isUserAutoPlayNextVideoPlaylistValid = exports.isUserAutoPlayNextVideoValid = exports.isUserAutoPlayVideoValid = exports.isUserWebTorrentEnabledValid = exports.isUserNSFWPolicyValid = exports.isUserEmailVerifiedValid = exports.isUserAdminFlagsValid = exports.isUserUsernameValid = exports.isUserVideoQuotaDailyValid = exports.isUserVideoQuotaValid = exports.isUserRoleValid = exports.isUserBlockedReasonValid = exports.isUserVideoLanguages = exports.isUserPasswordValidOrEmpty = exports.isUserPasswordValid = exports.isUserBlockedValid = exports.isUserVideosHistoryEnabledValid = void 0;
const validator_1 = require("validator");
const shared_1 = require("../../../shared");
const constants_1 = require("../../initializers/constants");
const misc_1 = require("./misc");
const lodash_1 = require("lodash");
const config_1 = require("../../initializers/config");
const USERS_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.USERS;
function isUserPasswordValid(value) {
    return validator_1.default.isLength(value, USERS_CONSTRAINTS_FIELDS.PASSWORD);
}
exports.isUserPasswordValid = isUserPasswordValid;
function isUserPasswordValidOrEmpty(value) {
    if (value === '')
        return config_1.isEmailEnabled();
    return isUserPasswordValid(value);
}
exports.isUserPasswordValidOrEmpty = isUserPasswordValidOrEmpty;
function isUserVideoQuotaValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt(value + '', USERS_CONSTRAINTS_FIELDS.VIDEO_QUOTA);
}
exports.isUserVideoQuotaValid = isUserVideoQuotaValid;
function isUserVideoQuotaDailyValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt(value + '', USERS_CONSTRAINTS_FIELDS.VIDEO_QUOTA_DAILY);
}
exports.isUserVideoQuotaDailyValid = isUserVideoQuotaDailyValid;
function isUserUsernameValid(value) {
    const max = USERS_CONSTRAINTS_FIELDS.USERNAME.max;
    const min = USERS_CONSTRAINTS_FIELDS.USERNAME.min;
    return misc_1.exists(value) && validator_1.default.matches(value, new RegExp(`^[a-z0-9._]{${min},${max}}$`));
}
exports.isUserUsernameValid = isUserUsernameValid;
function isUserDisplayNameValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isLength(value, constants_1.CONSTRAINTS_FIELDS.USERS.NAME));
}
exports.isUserDisplayNameValid = isUserDisplayNameValid;
function isUserDescriptionValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isLength(value, constants_1.CONSTRAINTS_FIELDS.USERS.DESCRIPTION));
}
exports.isUserDescriptionValid = isUserDescriptionValid;
function isUserEmailVerifiedValid(value) {
    return misc_1.isBooleanValid(value);
}
exports.isUserEmailVerifiedValid = isUserEmailVerifiedValid;
const nsfwPolicies = lodash_1.values(constants_1.NSFW_POLICY_TYPES);
function isUserNSFWPolicyValid(value) {
    return misc_1.exists(value) && nsfwPolicies.includes(value);
}
exports.isUserNSFWPolicyValid = isUserNSFWPolicyValid;
function isUserWebTorrentEnabledValid(value) {
    return misc_1.isBooleanValid(value);
}
exports.isUserWebTorrentEnabledValid = isUserWebTorrentEnabledValid;
function isUserVideosHistoryEnabledValid(value) {
    return misc_1.isBooleanValid(value);
}
exports.isUserVideosHistoryEnabledValid = isUserVideosHistoryEnabledValid;
function isUserAutoPlayVideoValid(value) {
    return misc_1.isBooleanValid(value);
}
exports.isUserAutoPlayVideoValid = isUserAutoPlayVideoValid;
function isUserVideoLanguages(value) {
    return value === null || (misc_1.isArray(value) && value.length < constants_1.CONSTRAINTS_FIELDS.USERS.VIDEO_LANGUAGES.max);
}
exports.isUserVideoLanguages = isUserVideoLanguages;
function isUserAdminFlagsValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt('' + value);
}
exports.isUserAdminFlagsValid = isUserAdminFlagsValid;
function isUserBlockedValid(value) {
    return misc_1.isBooleanValid(value);
}
exports.isUserBlockedValid = isUserBlockedValid;
function isUserAutoPlayNextVideoValid(value) {
    return misc_1.isBooleanValid(value);
}
exports.isUserAutoPlayNextVideoValid = isUserAutoPlayNextVideoValid;
function isUserAutoPlayNextVideoPlaylistValid(value) {
    return misc_1.isBooleanValid(value);
}
exports.isUserAutoPlayNextVideoPlaylistValid = isUserAutoPlayNextVideoPlaylistValid;
function isNoInstanceConfigWarningModal(value) {
    return misc_1.isBooleanValid(value);
}
exports.isNoInstanceConfigWarningModal = isNoInstanceConfigWarningModal;
function isNoWelcomeModal(value) {
    return misc_1.isBooleanValid(value);
}
exports.isNoWelcomeModal = isNoWelcomeModal;
function isUserBlockedReasonValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isLength(value, constants_1.CONSTRAINTS_FIELDS.USERS.BLOCKED_REASON));
}
exports.isUserBlockedReasonValid = isUserBlockedReasonValid;
function isUserRoleValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt('' + value) && shared_1.UserRole[value] !== undefined;
}
exports.isUserRoleValid = isUserRoleValid;
const avatarMimeTypes = constants_1.CONSTRAINTS_FIELDS.ACTORS.AVATAR.EXTNAME
    .map(v => v.replace('.', ''))
    .join('|');
const avatarMimeTypesRegex = `image/(${avatarMimeTypes})`;
function isAvatarFile(files) {
    return misc_1.isFileValid(files, avatarMimeTypesRegex, 'avatarfile', constants_1.CONSTRAINTS_FIELDS.ACTORS.AVATAR.FILE_SIZE.max);
}
exports.isAvatarFile = isAvatarFile;
