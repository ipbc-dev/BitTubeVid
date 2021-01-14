"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const fs_extra_1 = require("fs-extra");
const video_paths_1 = require("@server/lib/video-paths");
function up(utils) {
    return utils.db.Video.listOwnedAndPopulateAuthorAndTags()
        .then((videos) => {
        const tasks = [];
        videos.forEach(video => {
            video.VideoFiles.forEach(videoFile => {
                const p = new Promise((res, rej) => {
                    fs_extra_1.stat(video_paths_1.getVideoFilePath(video, videoFile), (err, stats) => {
                        if (err)
                            return rej(err);
                        videoFile.size = stats.size;
                        videoFile.save().then(res).catch(rej);
                    });
                });
                tasks.push(p);
            });
        });
        return tasks;
    })
        .then((tasks) => {
        return Promise.all(tasks);
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
