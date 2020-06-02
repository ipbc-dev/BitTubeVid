"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientFilterHookObject = {
    'filter:api.trending-videos.videos.list.params': true,
    'filter:api.trending-videos.videos.list.result': true,
    'filter:api.most-liked-videos.videos.list.params': true,
    'filter:api.most-liked-videos.videos.list.result': true,
    'filter:api.local-videos.videos.list.params': true,
    'filter:api.local-videos.videos.list.result': true,
    'filter:api.recently-added-videos.videos.list.params': true,
    'filter:api.recently-added-videos.videos.list.result': true,
    'filter:api.user-subscriptions-videos.videos.list.params': true,
    'filter:api.user-subscriptions-videos.videos.list.result': true,
    'filter:api.video-watch.video.get.params': true,
    'filter:api.video-watch.video.get.result': true,
    'filter:api.video-watch.video-threads.list.params': true,
    'filter:api.video-watch.video-threads.list.result': true,
    'filter:api.video-watch.video-thread-replies.list.params': true,
    'filter:api.video-watch.video-thread-replies.list.result': true,
    'filter:api.search.videos.list.params': true,
    'filter:api.search.videos.list.result': true,
    'filter:api.search.video-channels.list.params': true,
    'filter:api.search.video-channels.list.result': true,
    'filter:api.signup.registration.create.params': true,
    'filter:internal.video-watch.player.build-options.params': true,
    'filter:internal.video-watch.player.build-options.result': true,
    'filter:internal.common.svg-icons.get-content.params': true,
    'filter:internal.common.svg-icons.get-content.result': true
};
exports.clientActionHookObject = {
    'action:application.init': true,
    'action:video-watch.init': true,
    'action:video-watch.video.loaded': true,
    'action:video-watch.player.loaded': true,
    'action:video-watch.video-threads.loaded': true,
    'action:video-watch.video-thread-replies.loaded': true,
    'action:login.init': true,
    'action:search.init': true,
    'action:router.navigation-end': true,
    'action:signup.register.init': true
};
exports.clientHookObject = Object.assign({}, exports.clientFilterHookObject, exports.clientActionHookObject);
