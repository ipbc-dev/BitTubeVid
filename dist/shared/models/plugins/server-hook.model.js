"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverFilterHookObject = {
    'filter:api.videos.list.params': true,
    'filter:api.videos.list.result': true,
    'filter:api.video.get.result': true,
    'filter:api.video.upload.accept.result': true,
    'filter:api.video-thread.create.accept.result': true,
    'filter:api.video-comment-reply.create.accept.result': true,
    'filter:api.video-threads.list.params': true,
    'filter:api.video-threads.list.result': true,
    'filter:api.video-thread-comments.list.params': true,
    'filter:api.video-thread-comments.list.result': true,
    'filter:video.auto-blacklist.result': true,
    'filter:api.user.signup.allowed.result': true
};
exports.serverActionHookObject = {
    'action:application.listening': true,
    'action:api.video.updated': true,
    'action:api.video.deleted': true,
    'action:api.video.uploaded': true,
    'action:api.video.viewed': true,
    'action:api.video-thread.created': true,
    'action:api.video-comment-reply.created': true,
    'action:api.video-comment.deleted': true,
    'action:api.user.blocked': true,
    'action:api.user.unblocked': true,
    'action:api.user.registered': true,
    'action:api.user.created': true,
    'action:api.user.deleted': true,
    'action:api.user.updated': true,
    'action:api.user.oauth2-got-token': true
};
exports.serverHookObject = Object.assign({}, exports.serverFilterHookObject, exports.serverActionHookObject);
