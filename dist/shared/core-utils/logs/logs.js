"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mtimeSortFilesDesc = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
function mtimeSortFilesDesc(files, basePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const promises = [];
        const out = [];
        for (const file of files) {
            const p = fs_extra_1.stat(basePath + '/' + file)
                .then(stats => {
                if (stats.isFile())
                    out.push({ file, mtime: stats.mtime.getTime() });
            });
            promises.push(p);
        }
        yield Promise.all(promises);
        out.sort((a, b) => b.mtime - a.mtime);
        return out;
    });
}
exports.mtimeSortFilesDesc = mtimeSortFilesDesc;
