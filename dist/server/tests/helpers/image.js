"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const image_utils_1 = require("../../../server/helpers/image-utils");
const extra_utils_1 = require("../../../shared/extra-utils");
const chai_1 = require("chai");
function checkBuffers(path1, path2, equals) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const [buf1, buf2] = yield Promise.all([
            fs_extra_1.readFile(path1),
            fs_extra_1.readFile(path2)
        ]);
        if (equals) {
            chai_1.expect(buf1.equals(buf2)).to.be.true;
        }
        else {
            chai_1.expect(buf1.equals(buf2)).to.be.false;
        }
    });
}
describe('Image helpers', function () {
    const imageDestDir = path_1.join(extra_utils_1.root(), 'test-images');
    const imageDest = path_1.join(imageDestDir, 'test.jpg');
    const thumbnailSize = { width: 223, height: 122 };
    it('Should skip processing if the source image is okay', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const input = extra_utils_1.buildAbsoluteFixturePath('thumbnail.jpg');
            yield image_utils_1.processImage(input, imageDest, thumbnailSize, true);
            yield checkBuffers(input, imageDest, true);
        });
    });
    it('Should not skip processing if the source image does not have the appropriate extension', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const input = extra_utils_1.buildAbsoluteFixturePath('thumbnail.png');
            yield image_utils_1.processImage(input, imageDest, thumbnailSize, true);
            yield checkBuffers(input, imageDest, false);
        });
    });
    it('Should not skip processing if the source image does not have the appropriate size', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const input = extra_utils_1.buildAbsoluteFixturePath('preview.jpg');
            yield image_utils_1.processImage(input, imageDest, thumbnailSize, true);
            yield checkBuffers(input, imageDest, false);
        });
    });
    it('Should not skip processing if the source image does not have the appropriate size', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const input = extra_utils_1.buildAbsoluteFixturePath('thumbnail-big.jpg');
            yield image_utils_1.processImage(input, imageDest, thumbnailSize, true);
            yield checkBuffers(input, imageDest, false);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield fs_extra_1.remove(imageDest);
        });
    });
});
