"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SANITIZE_OPTIONS = void 0;
exports.SANITIZE_OPTIONS = {
    allowedTags: ['a', 'p', 'span', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    allowedSchemes: ['http', 'https'],
    allowedAttributes: {
        a: ['href', 'class', 'target', 'rel']
    },
    transformTags: {
        a: (tagName, attribs) => {
            let rel = 'noopener noreferrer';
            if (attribs.rel === 'me')
                rel += ' me';
            return {
                tagName,
                attribs: Object.assign(attribs, {
                    target: '_blank',
                    rel
                })
            };
        }
    }
};
