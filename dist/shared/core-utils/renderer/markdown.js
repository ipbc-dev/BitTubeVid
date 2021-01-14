"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLETE_RULES = exports.ENHANCED_WITH_HTML_RULES = exports.ENHANCED_RULES = exports.TEXT_WITH_HTML_RULES = exports.TEXT_RULES = void 0;
exports.TEXT_RULES = [
    'linkify',
    'autolink',
    'emphasis',
    'link',
    'newline',
    'list'
];
exports.TEXT_WITH_HTML_RULES = exports.TEXT_RULES.concat([
    'html_inline',
    'html_block'
]);
exports.ENHANCED_RULES = exports.TEXT_RULES.concat(['image']);
exports.ENHANCED_WITH_HTML_RULES = exports.TEXT_WITH_HTML_RULES.concat(['image']);
exports.COMPLETE_RULES = exports.ENHANCED_WITH_HTML_RULES.concat([
    'block',
    'inline',
    'heading',
    'paragraph'
]);
