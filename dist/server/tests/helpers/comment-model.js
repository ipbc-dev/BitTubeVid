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
        return __awaiter(this, void 0, void 0, function* () {
            const comment = new CommentMock();
            comment.text = '@florian @jean@localhost:9000 @flo @another@localhost:9000 @flo2@jean.com hello ' +
                'email@localhost:9000 coucou.com no? @chocobozzz @chocobozzz @end';
            const result = comment.extractMentions().sort((a, b) => a.localeCompare(b));
            expect(result).to.deep.equal(['another', 'chocobozzz', 'end', 'flo', 'florian', 'jean']);
        });
    });
});
