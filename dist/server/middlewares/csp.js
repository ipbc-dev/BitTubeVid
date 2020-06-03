"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helmet = require("helmet");
const config_1 = require("../initializers/config");
const baseDirectives = Object.assign({}, {
    defaultSrc: ['\'none\''],
    connectSrc: ['*', 'data:'],
    mediaSrc: ['\'self\'', 'https:', 'blob:'],
    fontSrc: ['\'self\'', 'data:'],
    imgSrc: ['\'self\'', 'data:', 'blob:'],
    scriptSrc: ['\'self\' \'unsafe-inline\' \'unsafe-eval\'', 'blob:'],
    styleSrc: ['\'self\' \'unsafe-inline\''],
    objectSrc: ['\'none\''],
    formAction: ['\'self\''],
    frameAncestors: ['\'none\''],
    baseUri: ['\'self\''],
    manifestSrc: ['\'self\''],
    frameSrc: ['\'self\''],
    workerSrc: ['\'self\'', 'blob:']
}, config_1.CONFIG.CSP.REPORT_URI ? { reportUri: config_1.CONFIG.CSP.REPORT_URI } : {}, config_1.CONFIG.WEBSERVER.SCHEME === 'https' ? { upgradeInsecureRequests: true } : {});
const baseCSP = helmet.contentSecurityPolicy({
    directives: baseDirectives,
    browserSniff: false,
    reportOnly: config_1.CONFIG.CSP.REPORT_ONLY
});
exports.baseCSP = baseCSP;
const embedCSP = helmet.contentSecurityPolicy({
    directives: Object.assign({}, baseDirectives, { frameAncestors: ['*'] }),
    browserSniff: false,
    reportOnly: config_1.CONFIG.CSP.REPORT_ONLY
});
exports.embedCSP = embedCSP;
