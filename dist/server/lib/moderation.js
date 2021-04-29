"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccountAbuse = exports.createVideoCommentAbuse = exports.createVideoAbuse = exports.createAbuse = exports.isPostImportVideoAccepted = exports.isPreImportVideoAccepted = exports.isLocalVideoCommentReplyAccepted = exports.isRemoteVideoCommentAccepted = exports.isRemoteVideoAccepted = exports.isLocalVideoThreadAccepted = exports.isLocalVideoAccepted = exports.isLocalLiveVideoAccepted = void 0;
const tslib_1 = require("tslib");
const audit_logger_1 = require("@server/helpers/audit-logger");
const logger_1 = require("@server/helpers/logger");
const abuse_1 = require("@server/models/abuse/abuse");
const video_abuse_1 = require("@server/models/abuse/video-abuse");
const video_comment_abuse_1 = require("@server/models/abuse/video-comment-abuse");
const send_flag_1 = require("./activitypub/send/send-flag");
const notifier_1 = require("./notifier");
const database_utils_1 = require("@server/helpers/database-utils");
function isLocalVideoAccepted(object) {
    return { accepted: true };
}
exports.isLocalVideoAccepted = isLocalVideoAccepted;
function isLocalLiveVideoAccepted(object) {
    return { accepted: true };
}
exports.isLocalLiveVideoAccepted = isLocalLiveVideoAccepted;
function isLocalVideoThreadAccepted(_object) {
    return { accepted: true };
}
exports.isLocalVideoThreadAccepted = isLocalVideoThreadAccepted;
function isLocalVideoCommentReplyAccepted(_object) {
    return { accepted: true };
}
exports.isLocalVideoCommentReplyAccepted = isLocalVideoCommentReplyAccepted;
function isRemoteVideoAccepted(_object) {
    return { accepted: true };
}
exports.isRemoteVideoAccepted = isRemoteVideoAccepted;
function isRemoteVideoCommentAccepted(_object) {
    return { accepted: true };
}
exports.isRemoteVideoCommentAccepted = isRemoteVideoCommentAccepted;
function isPreImportVideoAccepted(object) {
    return { accepted: true };
}
exports.isPreImportVideoAccepted = isPreImportVideoAccepted;
function isPostImportVideoAccepted(object) {
    return { accepted: true };
}
exports.isPostImportVideoAccepted = isPostImportVideoAccepted;
function createVideoAbuse(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { baseAbuse, videoInstance, startAt, endAt, transaction, reporterAccount } = options;
        const associateFun = (abuseInstance) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoAbuseInstance = yield video_abuse_1.VideoAbuseModel.create({
                abuseId: abuseInstance.id,
                videoId: videoInstance.id,
                startAt: startAt,
                endAt: endAt
            }, { transaction });
            videoAbuseInstance.Video = videoInstance;
            abuseInstance.VideoAbuse = videoAbuseInstance;
            return { isOwned: videoInstance.isOwned() };
        });
        return createAbuse({
            base: baseAbuse,
            reporterAccount,
            flaggedAccount: videoInstance.VideoChannel.Account,
            transaction,
            associateFun
        });
    });
}
exports.createVideoAbuse = createVideoAbuse;
function createVideoCommentAbuse(options) {
    const { baseAbuse, commentInstance, transaction, reporterAccount } = options;
    const associateFun = (abuseInstance) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const commentAbuseInstance = yield video_comment_abuse_1.VideoCommentAbuseModel.create({
            abuseId: abuseInstance.id,
            videoCommentId: commentInstance.id
        }, { transaction });
        commentAbuseInstance.VideoComment = commentInstance;
        abuseInstance.VideoCommentAbuse = commentAbuseInstance;
        return { isOwned: commentInstance.isOwned() };
    });
    return createAbuse({
        base: baseAbuse,
        reporterAccount,
        flaggedAccount: commentInstance.Account,
        transaction,
        associateFun
    });
}
exports.createVideoCommentAbuse = createVideoCommentAbuse;
function createAccountAbuse(options) {
    const { baseAbuse, accountInstance, transaction, reporterAccount } = options;
    const associateFun = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        return { isOwned: accountInstance.isOwned() };
    });
    return createAbuse({
        base: baseAbuse,
        reporterAccount,
        flaggedAccount: accountInstance,
        transaction,
        associateFun
    });
}
exports.createAccountAbuse = createAccountAbuse;
function createAbuse(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { base, reporterAccount, flaggedAccount, associateFun, transaction } = options;
        const auditLogger = audit_logger_1.auditLoggerFactory('abuse');
        const abuseAttributes = Object.assign({}, base, { flaggedAccountId: flaggedAccount.id });
        const abuseInstance = yield abuse_1.AbuseModel.create(abuseAttributes, { transaction });
        abuseInstance.ReporterAccount = reporterAccount;
        abuseInstance.FlaggedAccount = flaggedAccount;
        const { isOwned } = yield associateFun(abuseInstance);
        if (isOwned === false) {
            yield send_flag_1.sendAbuse(reporterAccount.Actor, abuseInstance, abuseInstance.FlaggedAccount, transaction);
        }
        const abuseJSON = abuseInstance.toFormattedAdminJSON();
        auditLogger.create(reporterAccount.Actor.getIdentifier(), new audit_logger_1.AbuseAuditView(abuseJSON));
        database_utils_1.afterCommitIfTransaction(transaction, () => {
            notifier_1.Notifier.Instance.notifyOnNewAbuse({
                abuse: abuseJSON,
                abuseInstance,
                reporter: reporterAccount.Actor.getIdentifier()
            });
        });
        logger_1.logger.info('Abuse report %d created.', abuseInstance.id);
        return abuseJSON;
    });
}
exports.createAbuse = createAbuse;
