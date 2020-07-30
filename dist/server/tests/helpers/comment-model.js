"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const video_comment_1 = require("../../models/video/video-comment");
const expect = chai.expect;
class CommentMock {
    constructor() {
        this.extractMentions = video_comment_1.VideoCommentModel.prototype.extractMentions;
        this.isOwned = () => true;
    }
}
describe('Comment model', function () {
    it('Should correctly extract mentions', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const comment = new CommentMock();
            comment.text = '@florian @jean@localhost:9000 @flo @another@localhost:9000 @flo2@jean.com hello ' +
                'email@localhost:9000 coucou.com no? @chocobozzz @chocobozzz @end';
            const result = comment.extractMentions().sort((a, b) => a.localeCompare(b));
            expect(result).to.deep.equal(['another', 'chocobozzz', 'end', 'flo', 'florian', 'jean']);
        });
    });
});
