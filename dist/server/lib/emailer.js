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
const nodemailer_1 = require("nodemailer");
const core_utils_1 = require("../helpers/core-utils");
const logger_1 = require("../helpers/logger");
const config_1 = require("../initializers/config");
const job_queue_1 = require("./job-queue");
const fs_extra_1 = require("fs-extra");
const constants_1 = require("../initializers/constants");
class Emailer {
    constructor() {
        this.initialized = false;
    }
    init() {
        if (this.initialized === true)
            return;
        this.initialized = true;
        if (Emailer.isEnabled()) {
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
            if (!core_utils_1.isTestInstance()) {
                logger_1.logger.error('Cannot use SMTP server because of lack of configuration. BitTube will not be able to send mails!');
            }
        }
    }
    static isEnabled() {
        return !!config_1.CONFIG.SMTP.HOSTNAME && !!config_1.CONFIG.SMTP.PORT;
    }
    checkConnectionOrDie() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.transporter)
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
        const text = `Hi dear user,\n\n` +
            `Your subscription ${channelName} just published a new video: ${video.name}` +
            `\n\n` +
            `You can view it on ${videoUrl} ` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + channelName + ' just published a new video',
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addNewFollowNotification(to, actorFollow, followType) {
        const followerName = actorFollow.ActorFollower.Account.getDisplayName();
        const followingName = (actorFollow.ActorFollowing.VideoChannel || actorFollow.ActorFollowing.Account).getDisplayName();
        const text = `Hi dear user,\n\n` +
            `Your ${followType} ${followingName} has a new subscriber: ${followerName}` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'New follower on your channel ' + followingName,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addNewInstanceFollowerNotification(to, actorFollow) {
        const awaitingApproval = actorFollow.state === 'pending' ? ' awaiting manual approval.' : '';
        const text = `Hi dear admin,\n\n` +
            `Your instance has a new follower: ${actorFollow.ActorFollower.url}${awaitingApproval}` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'New instance follower',
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addAutoInstanceFollowingNotification(to, actorFollow) {
        const text = `Hi dear admin,\n\n` +
            `Your instance automatically followed a new instance: ${actorFollow.ActorFollowing.url}` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'Auto instance following',
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    myVideoPublishedNotification(to, video) {
        const videoUrl = constants_1.WEBSERVER.URL + video.getWatchStaticPath();
        const text = `Hi dear user,\n\n` +
            `Your video ${video.name} has been published.` +
            `\n\n` +
            `You can view it on ${videoUrl} ` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + `Your video ${video.name} is published`,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    myVideoImportSuccessNotification(to, videoImport) {
        const videoUrl = constants_1.WEBSERVER.URL + videoImport.Video.getWatchStaticPath();
        const text = `Hi dear user,\n\n` +
            `Your video import ${videoImport.getTargetIdentifier()} is finished.` +
            `\n\n` +
            `You can view the imported video on ${videoUrl} ` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + `Your video import ${videoImport.getTargetIdentifier()} is finished`,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    myVideoImportErrorNotification(to, videoImport) {
        const importUrl = constants_1.WEBSERVER.URL + '/my-account/video-imports';
        const text = `Hi dear user,\n\n` +
            `Your video import ${videoImport.getTargetIdentifier()} encountered an error.` +
            `\n\n` +
            `See your videos import dashboard for more information: ${importUrl}` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + `Your video import ${videoImport.getTargetIdentifier()} encountered an error`,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addNewCommentOnMyVideoNotification(to, comment) {
        const accountName = comment.Account.getDisplayName();
        const video = comment.Video;
        const commentUrl = constants_1.WEBSERVER.URL + comment.getCommentStaticPath();
        const text = `Hi dear user,\n\n` +
            `A new comment has been posted by ${accountName} on your video ${video.name}` +
            `\n\n` +
            `You can view it on ${commentUrl} ` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'New comment on your video ' + video.name,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addNewCommentMentionNotification(to, comment) {
        const accountName = comment.Account.getDisplayName();
        const video = comment.Video;
        const commentUrl = constants_1.WEBSERVER.URL + comment.getCommentStaticPath();
        const text = `Hi dear user,\n\n` +
            `${accountName} mentioned you on video ${video.name}` +
            `\n\n` +
            `You can view the comment on ${commentUrl} ` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'Mention on video ' + video.name,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addVideoAbuseModeratorsNotification(to, videoAbuse) {
        const videoUrl = constants_1.WEBSERVER.URL + videoAbuse.Video.getWatchStaticPath();
        const text = `Hi,\n\n` +
            `${constants_1.WEBSERVER.HOST} received an abuse for the following video ${videoUrl}\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'Received a video abuse',
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addVideoAutoBlacklistModeratorsNotification(to, videoBlacklist) {
        const VIDEO_AUTO_BLACKLIST_URL = constants_1.WEBSERVER.URL + '/admin/moderation/video-auto-blacklist/list';
        const videoUrl = constants_1.WEBSERVER.URL + videoBlacklist.Video.getWatchStaticPath();
        const text = `Hi,\n\n` +
            `A recently added video was auto-blacklisted and requires moderator review before publishing.` +
            `\n\n` +
            `You can view it and take appropriate action on ${videoUrl}` +
            `\n\n` +
            `A full list of auto-blacklisted videos can be reviewed here: ${VIDEO_AUTO_BLACKLIST_URL}` +
            `\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'An auto-blacklisted video is awaiting review',
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addNewUserRegistrationNotification(to, user) {
        const text = `Hi,\n\n` +
            `User ${user.username} just registered on ${constants_1.WEBSERVER.HOST} PeerTube instance.\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'New user registration on ' + constants_1.WEBSERVER.HOST,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addVideoBlacklistNotification(to, videoBlacklist) {
        const videoName = videoBlacklist.Video.name;
        const videoUrl = constants_1.WEBSERVER.URL + videoBlacklist.Video.getWatchStaticPath();
        const reasonString = videoBlacklist.reason ? ` for the following reason: ${videoBlacklist.reason}` : '';
        const blockedString = `Your video ${videoName} (${videoUrl} on ${constants_1.WEBSERVER.HOST} has been blacklisted${reasonString}.`;
        const text = 'Hi,\n\n' +
            blockedString +
            '\n\n' +
            'Cheers,\n' +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + `Video ${videoName} blacklisted`,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addVideoUnblacklistNotification(to, video) {
        const videoUrl = constants_1.WEBSERVER.URL + video.getWatchStaticPath();
        const text = 'Hi,\n\n' +
            `Your video ${video.name} (${videoUrl}) on ${constants_1.WEBSERVER.HOST} has been unblacklisted.` +
            '\n\n' +
            'Cheers,\n' +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to,
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + `Video ${video.name} unblacklisted`,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addPasswordResetEmailJob(to, resetPasswordUrl) {
        const text = `Hi dear user,\n\n` +
            `A reset password procedure for your account ${to} has been requested on ${constants_1.WEBSERVER.HOST} ` +
            `Please follow this link to reset it: ${resetPasswordUrl}  (the link will expire within 1 hour)\n\n` +
            `If you are not the person who initiated this request, please ignore this email.\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to: [to],
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'Reset your password',
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addVerifyEmailJob(to, verifyEmailUrl) {
        const text = 'Welcome to BitTube,\n\n' +
            `To start using BitTube on ${constants_1.WEBSERVER.HOST} you must  verify your email! ` +
            `Please follow this link to verify this email belongs to you: ${verifyEmailUrl}\n\n` +
            `If you are not the person who initiated this request, please ignore this email.\n\n` +
            `Cheers,\n` +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const emailPayload = {
            to: [to],
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'Verify your email',
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addUserBlockJob(user, blocked, reason) {
        const reasonString = reason ? ` for the following reason: ${reason}` : '';
        const blockedWord = blocked ? 'blocked' : 'unblocked';
        const blockedString = `Your account ${user.username} on ${constants_1.WEBSERVER.HOST} has been ${blockedWord}${reasonString}.`;
        const text = 'Hi,\n\n' +
            blockedString +
            '\n\n' +
            'Cheers,\n' +
            `${config_1.CONFIG.EMAIL.BODY.SIGNATURE}`;
        const to = user.email;
        const emailPayload = {
            to: [to],
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + 'Account ' + blockedWord,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    addContactFormJob(fromEmail, fromName, subject, body) {
        const text = 'Hello dear admin,\n\n' +
            fromName + ' sent you a message' +
            '\n\n---------------------------------------\n\n' +
            body +
            '\n\n---------------------------------------\n\n' +
            'Cheers,\n' +
            'BitTube.';
        const emailPayload = {
            fromDisplayName: fromEmail,
            replyTo: fromEmail,
            to: [config_1.CONFIG.ADMIN.EMAIL],
            subject: config_1.CONFIG.EMAIL.SUBJECT.PREFIX + subject,
            text
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'email', payload: emailPayload });
    }
    sendMail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Emailer.isEnabled()) {
                throw new Error('Cannot send mail because SMTP is not configured.');
            }
            const fromDisplayName = options.fromDisplayName
                ? options.fromDisplayName
                : constants_1.WEBSERVER.HOST;
            for (const to of options.to) {
                yield this.transporter.sendMail({
                    from: `"${fromDisplayName}" <${config_1.CONFIG.SMTP.FROM_ADDRESS}>`,
                    replyTo: options.replyTo,
                    to,
                    subject: options.subject,
                    text: options.text
                });
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
