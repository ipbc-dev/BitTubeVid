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
const fs_extra_1 = require("fs-extra");
function mtimeSortFilesDesc(files, basePath) {
    return __awaiter(this, void 0, void 0, function* () {
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
