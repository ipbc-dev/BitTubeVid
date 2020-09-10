"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emailer = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
const nodemailer_1 = require("nodemailer");
const path_1 = require("path");
const video_channel_1 = require("@server/models/video/video-channel");
const core_utils_1 = require("../helpers/core-utils");
const logger_1 = require("../helpers/logger");
const config_1 = require("../initializers/config");
const constants_1 = require("../initializers/constants");
const job_queue_1 = require("./job-queue");
const Email = require('email-templates');
class Emailer {
    constructor() {
        this.initialized = false;
    }
    init() {
        if (this.initialized === true)
            return;
        this.initialized = true;
        if (config_1.isEmailEnabled()) {
            if (config_1.CONFIG.SMTP.TRANSPORT === 'smtp') {
                logger_1.logger.info('Using %s:%s as SMTP server.', config_1.CONFIG.SMTP.HOSTNAME, config_1.CONFIG.SMTP.PORT);
                let tls;
                if (config_1.CONFIG.SMTP.CA_FILE) {
                    tls = {
                        ca: [fs_extra_1.readFileSync(config_1.CONFIG.SMTP.CA_FILE)]
                    };
                }
                let auth;
                if (config_1.CONFIG.SMTP.USERNAME && config_1.CONFIG.SMTP.PASSWORD) {
                    auth = {
                        user: config_1.CONFIG.SMTP.USERNAME,
                        pass: config_1.CONFIG.SMTP.PASSWORD
                    };
                }
                this.transporter = nodemailer_1.createTransport({
                    host: config_1.CONFIG.SMTP.HOSTNAME,
                    port: config_1.CONFIG.SMTP.PORT,
                    secure: config_1.CONFIG.SMTP.TLS,
                    debug: config_1.CONFIG.LOG.LEVEL === 'debug',
                    logger: logger_1.bunyanLogger,
                    ignoreTLS: config_1.CONFIG.SMTP.DISABLE_STARTTLS,
                    tls,
                    auth
                });
            }
            else {
                logger_1.logger.info('Using sendmail to send emails');
                this.transporter = nodemailer_1.createTransport({
                    sendmail: true,
                    newline: 'unix',
                    path: config_1.CONFIG.SMTP.SENDMAIL
                });
            }
        }
        else {
            if (!core_utils_1.isTestInstance()) {
                logger_1.logger.error('Cannot use SMTP server because of lack of configuration. BitTube will not be able to send mails!');
            }
        }
    }
    static isEnabled() {
        if (config_1.CONFIG.SMTP.TRANSPORT === 'sendmail') {
            return !!config_1.CONFIG.SMTP.SENDMAIL;
        }
        else if (config_1.CONFIG.SMTP.TRANSPORT === 'smtp') {
            return !!config_1.CONFIG.SMTP.HOSTNAME && !!config_1.CONFIG.SMTP.PORT;
        }
        else {
            return false;
        }
    }
    checkConnectionOrDie() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.transporter || config_1.CONFIG.SMTP.TRANSPORT !== 'smtp')
                return;
            logger_1.logger.info('Testing SMTP server...');
            try {
                const success = yield this.transporter.verify();
                if (success !== true)
                    this.dieOnConnectionFailure();
                logger_1.logger.info('Successfully connected to SMTP server.');
            }
            catch (err) {
                this.dieOnConnectionFailure(err);
            }
        });
    }
    addNewVideoFromSubscriberNotification(to, video) {
        const channelName = video.VideoChannel.getDisplayName();
        const videoUrl = constants_1.WEBSERVER.URL + video.getWatchStaticPath();
        const emailPayload = {
            to,
            subject: channelName + ' just published a new video',
            text: `Your subscription ${channelName} just published a new video: "${video.name}".`,
            locals: {
                title: 'New content ',
                action: {
                    text: 'View video',
                    url: videoUrl
                }
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addNewFollowNotification(to, actorFollow, followType) {
        const followingName = (actorFollow.ActorFollowing.VideoChannel || actorFollow.ActorFollowing.Account).getDisplayName();
        const emailPayload = {
            template: 'follower-on-channel',
            to,
            subject: `New follower on your channel ${followingName}`,
            locals: {
                followerName: actorFollow.ActorFollower.Account.getDisplayName(),
                followerUrl: actorFollow.ActorFollower.url,
                followingName,
                followingUrl: actorFollow.ActorFollowing.url,
                followType
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addNewInstanceFollowerNotification(to, actorFollow) {
        const awaitingApproval = actorFollow.state === 'pending' ? ' awaiting manual approval.' : '';
        const emailPayload = {
            to,
            subject: 'New instance follower',
            text: `Your instance has a new follower: ${actorFollow.ActorFollower.url}${awaitingApproval}.`,
            locals: {
                title: 'New instance follower',
                action: {
                    text: 'Review followers',
                    url: constants_1.WEBSERVER.URL + '/admin/follows/followers-list'
                }
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addAutoInstanceFollowingNotification(to, actorFollow) {
        const instanceUrl = actorFollow.ActorFollowing.url;
        const emailPayload = {
            to,
            subject: 'Auto instance following',
            text: `Your instance automatically followed a new instance: <a href="${instanceUrl}">${instanceUrl}</a>.`
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    myVideoPublishedNotification(to, video) {
        const videoUrl = constants_1.WEBSERVER.URL + video.getWatchStaticPath();
        const emailPayload = {
            to,
            subject: `Your video ${video.name} has been published`,
            text: `Your video "${video.name}" has been published.`,
            locals: {
                title: 'You video is live',
                action: {
                    text: 'View video',
                    url: videoUrl
                }
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    myVideoImportSuccessNotification(to, videoImport) {
        const videoUrl = constants_1.WEBSERVER.URL + videoImport.Video.getWatchStaticPath();
        const emailPayload = {
            to,
            subject: `Your video import ${videoImport.getTargetIdentifier()} is complete`,
            text: `Your video "${videoImport.getTargetIdentifier()}" just finished importing.`,
            locals: {
                title: 'Import complete',
                action: {
                    text: 'View video',
                    url: videoUrl
                }
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    myVideoImportErrorNotification(to, videoImport) {
        const importUrl = constants_1.WEBSERVER.URL + '/my-account/video-imports';
        const text = `Your video import "${videoImport.getTargetIdentifier()}" encountered an error.` +
            '\n\n' +
            `See your videos import dashboard for more information: <a href="${importUrl}">${importUrl}</a>.`;
        const emailPayload = {
            to,
            subject: `Your video import "${videoImport.getTargetIdentifier()}" encountered an error`,
            text,
            locals: {
                title: 'Import failed',
                action: {
                    text: 'Review imports',
                    url: importUrl
                }
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addNewCommentOnMyVideoNotification(to, comment) {
        const video = comment.Video;
        const videoUrl = constants_1.WEBSERVER.URL + comment.Video.getWatchStaticPath();
        const commentUrl = constants_1.WEBSERVER.URL + comment.getCommentStaticPath();
        const emailPayload = {
            template: 'video-comment-new',
            to,
            subject: 'New comment on your video ' + video.name,
            locals: {
                accountName: comment.Account.getDisplayName(),
                accountUrl: comment.Account.Actor.url,
                comment,
                video,
                videoUrl,
                action: {
                    text: 'View comment',
                    url: commentUrl
                }
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addNewCommentMentionNotification(to, comment) {
        const accountName = comment.Account.getDisplayName();
        const video = comment.Video;
        const videoUrl = constants_1.WEBSERVER.URL + comment.Video.getWatchStaticPath();
        const commentUrl = constants_1.WEBSERVER.URL + comment.getCommentStaticPath();
        const emailPayload = {
            template: 'video-comment-mention',
            to,
            subject: 'Mention on video ' + video.name,
            locals: {
                comment,
                video,
                videoUrl,
                accountName,
                action: {
                    text: 'View comment',
                    url: commentUrl
                }
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addAbuseModeratorsNotification(to, parameters) {
        const { abuse, abuseInstance, reporter } = parameters;
        const action = {
            text: 'View report #' + abuse.id,
            url: constants_1.WEBSERVER.URL + '/admin/moderation/abuses/list?search=%23' + abuse.id
        };
        let emailPayload;
        if (abuseInstance.VideoAbuse) {
            const video = abuseInstance.VideoAbuse.Video;
            const videoUrl = constants_1.WEBSERVER.URL + video.getWatchStaticPath();
            emailPayload = {
                template: 'video-abuse-new',
                to,
                subject: `New video abuse report from ${reporter}`,
                locals: {
                    videoUrl,
                    isLocal: video.remote === false,
                    videoCreatedAt: new Date(video.createdAt).toLocaleString(),
                    videoPublishedAt: new Date(video.publishedAt).toLocaleString(),
                    videoName: video.name,
                    reason: abuse.reason,
                    videoChannel: abuse.video.channel,
                    reporter,
                    action
                }
            };
        }
        else if (abuseInstance.VideoCommentAbuse) {
            const comment = abuseInstance.VideoCommentAbuse.VideoComment;
            const commentUrl = constants_1.WEBSERVER.URL + comment.Video.getWatchStaticPath() + ';threadId=' + comment.getThreadId();
            emailPayload = {
                template: 'video-comment-abuse-new',
                to,
                subject: `New comment abuse report from ${reporter}`,
                locals: {
                    commentUrl,
                    videoName: comment.Video.name,
                    isLocal: comment.isOwned(),
                    commentCreatedAt: new Date(comment.createdAt).toLocaleString(),
                    reason: abuse.reason,
                    flaggedAccount: abuseInstance.FlaggedAccount.getDisplayName(),
                    reporter,
                    action
                }
            };
        }
        else {
            const account = abuseInstance.FlaggedAccount;
            const accountUrl = account.getClientUrl();
            emailPayload = {
                template: 'account-abuse-new',
                to,
                subject: `New account abuse report from ${reporter}`,
                locals: {
                    accountUrl,
                    accountDisplayName: account.getDisplayName(),
                    isLocal: account.isOwned(),
                    reason: abuse.reason,
                    reporter,
                    action
                }
            };
        }
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addAbuseStateChangeNotification(to, abuse) {
        const text = abuse.state === 3
            ? 'Report #' + abuse.id + ' has been accepted'
            : 'Report #' + abuse.id + ' has been rejected';
        const abuseUrl = constants_1.WEBSERVER.URL + '/my-account/abuses?search=%23' + abuse.id;
        const action = {
            text,
            url: abuseUrl
        };
        const emailPayload = {
            template: 'abuse-state-change',
            to,
            subject: text,
            locals: {
                action,
                abuseId: abuse.id,
                abuseUrl,
                isAccepted: abuse.state === 3
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addAbuseNewMessageNotification(to, options) {
        const { abuse, target, message, accountMessage } = options;
        const text = 'New message on report #' + abuse.id;
        const abuseUrl = target === 'moderator'
            ? constants_1.WEBSERVER.URL + '/admin/moderation/abuses/list?search=%23' + abuse.id
            : constants_1.WEBSERVER.URL + '/my-account/abuses?search=%23' + abuse.id;
        const action = {
            text,
            url: abuseUrl
        };
        const emailPayload = {
            template: 'abuse-new-message',
            to,
            subject: text,
            locals: {
                abuseId: abuse.id,
                abuseUrl: action.url,
                messageAccountName: accountMessage.getDisplayName(),
                messageText: message.message,
                action
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addVideoAutoBlacklistModeratorsNotification(to, videoBlacklist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const VIDEO_AUTO_BLACKLIST_URL = constants_1.WEBSERVER.URL + '/admin/moderation/video-auto-blacklist/list';
            const videoUrl = constants_1.WEBSERVER.URL + videoBlacklist.Video.getWatchStaticPath();
            const channel = (yield video_channel_1.VideoChannelModel.loadByIdAndPopulateAccount(videoBlacklist.Video.channelId)).toFormattedSummaryJSON();
            const emailPayload = {
                template: 'video-auto-blacklist-new',
                to,
                subject: 'A new video is pending moderation',
                locals: {
                    channel,
                    videoUrl,
                    videoName: videoBlacklist.Video.name,
                    action: {
                        text: 'Review autoblacklist',
                        url: VIDEO_AUTO_BLACKLIST_URL
                    }
                }
            };
            return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
        });
    }
    addNewUserRegistrationNotification(to, user) {
        const emailPayload = {
            template: 'user-registered',
            to,
            subject: `a new user registered on ${constants_1.WEBSERVER.HOST}: ${user.username}`,
            locals: {
                user
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addVideoBlacklistNotification(to, videoBlacklist) {
        const videoName = videoBlacklist.Video.name;
        const videoUrl = constants_1.WEBSERVER.URL + videoBlacklist.Video.getWatchStaticPath();
        const reasonString = videoBlacklist.reason ? ` for the following reason: ${videoBlacklist.reason}` : '';
        const blockedString = `Your video ${videoName} (${videoUrl} on ${constants_1.WEBSERVER.HOST} has been blacklisted${reasonString}.`;
        const emailPayload = {
            to,
            subject: `Video ${videoName} blacklisted`,
            text: blockedString,
            locals: {
                title: 'Your video was blacklisted'
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addVideoUnblacklistNotification(to, video) {
        const videoUrl = constants_1.WEBSERVER.URL + video.getWatchStaticPath();
        const emailPayload = {
            to,
            subject: `Video ${video.name} unblacklisted`,
            text: `Your video "${video.name}" (${videoUrl}) on ${constants_1.WEBSERVER.HOST} has been unblacklisted.`,
            locals: {
                title: 'Your video was unblacklisted'
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addPasswordResetEmailJob(username, to, resetPasswordUrl) {
        const emailPayload = {
            template: 'password-reset',
            to: [to],
            subject: 'Reset your account password',
            locals: {
                username,
                resetPasswordUrl
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addPasswordCreateEmailJob(username, to, createPasswordUrl) {
        const emailPayload = {
            template: 'password-create',
            to: [to],
            subject: 'Create your account password',
            locals: {
                username,
                createPasswordUrl
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addVerifyEmailJob(username, to, verifyEmailUrl) {
        const emailPayload = {
            template: 'verify-email',
            to: [to],
            subject: `Verify your email on ${constants_1.WEBSERVER.HOST}`,
            locals: {
                username,
                verifyEmailUrl
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addUserBlockJob(user, blocked, reason) {
        const reasonString = reason ? ` for the following reason: ${reason}` : '';
        const blockedWord = blocked ? 'blocked' : 'unblocked';
        const to = user.email;
        const emailPayload = {
            to: [to],
            subject: 'Account ' + blockedWord,
            text: `Your account ${user.username} on ${constants_1.WEBSERVER.HOST} has been ${blockedWord}${reasonString}.`
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addContactFormJob(fromEmail, fromName, subject, body) {
        const emailPayload = {
            template: 'contact-form',
            to: [config_1.CONFIG.ADMIN.EMAIL],
            replyTo: `"${fromName}" <${fromEmail}>`,
            subject: `(contact form) ${subject}`,
            locals: {
                fromName,
                fromEmail,
                body
            }
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    sendMail(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!config_1.isEmailEnabled()) {
                throw new Error('Cannot send mail because SMTP is not configured.');
            }
            const fromDisplayName = options.from
                ? options.from
                : constants_1.WEBSERVER.HOST;
            const email = new Email({
                send: true,
                message: {
                    from: `"${fromDisplayName}" <${config_1.CONFIG.SMTP.FROM_ADDRESS}>`
                },
                transport: this.transporter,
                views: {
                    root: path_1.join(core_utils_1.root(), 'dist', 'server', 'lib', 'emails')
                },
                subjectPrefix: config_1.CONFIG.EMAIL.SUBJECT.PREFIX
            });
            for (const to of options.to) {
                yield email
                    .send(lodash_1.merge({
                    template: 'common',
                    message: {
                        to,
                        from: options.from,
                        subject: options.subject,
                        replyTo: options.replyTo
                    },
                    locals: {
                        WEBSERVER: constants_1.WEBSERVER,
                        EMAIL: config_1.CONFIG.EMAIL,
                        text: options.text,
                        subject: options.subject
                    }
                }, options))
                    .then(res => logger_1.logger.debug('Sent email.', { res }))
                    .catch(err => logger_1.logger.error('Error in email sender.', { err }));
            }
        });
    }
    dieOnConnectionFailure(err) {
        logger_1.logger.error('Failed to connect to SMTP %s:%d.', config_1.CONFIG.SMTP.HOSTNAME, config_1.CONFIG.SMTP.PORT, { err });
        process.exit(-1);
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.Emailer = Emailer;
