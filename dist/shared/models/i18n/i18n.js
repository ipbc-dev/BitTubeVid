"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCALE_FILES = ['player', 'server'];
exports.I18N_LOCALES = {
    'en-US': 'English',
    'ca-ES': 'Català',
    'cs-CZ': 'Čeština',
    'de-DE': 'Deutsch',
    'el-GR': 'ελληνικά',
    'eo': 'Esperanto',
    'es-ES': 'Español',
    'eu-ES': 'Euskara',
    'fi-FI': 'suomi',
    'fr-FR': 'Français',
    'gd': 'Gàidhlig',
    'hu-HU': 'magyar',
    'it-IT': 'Italiano',
    'ja-JP': '日本語',
    'nl-NL': 'Nederlands',
    'pl-PL': 'Polski',
    'pt-BR': 'Português (Brasil)',
    'pt-PT': 'Português (Portugal)',
    'ru-RU': 'русский',
    'sv-SE': 'svenska',
    'th-TH': 'ไทย',
    'zh-Hans-CN': '简体中文（中国）',
    'zh-Hant-TW': '繁體中文（台灣）'
};
const I18N_LOCALE_ALIAS = {
    'ca': 'ca-ES',
    'cs': 'cs-CZ',
    'de': 'de-DE',
    'el': 'el-GR',
    'en': 'en-US',
    'es': 'es-ES',
    'eu': 'eu-ES',
    'fi': 'fi-FI',
    'fr': 'fr-FR',
    'ja': 'ja-JP',
    'it': 'it-IT',
    'hu': 'hu-HU',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'pt': 'pt-BR',
    'ru': 'ru-RU',
    'sv': 'sv-SE',
    'th': 'th-TH',
    'zh': 'zh-Hans-CN',
    'zh-Hans': 'zh-Hans-CN',
    'zh-CN': 'zh-Hans-CN',
    'zh-Hant': 'zh-Hant-TW',
    'zh-TW': 'zh-Hant-TW'
};
exports.POSSIBLE_LOCALES = Object.keys(exports.I18N_LOCALES)
    .concat(Object.keys(I18N_LOCALE_ALIAS));
function getDefaultLocale() {
    return 'en-US';
}
exports.getDefaultLocale = getDefaultLocale;
function isDefaultLocale(locale) {
    return getCompleteLocale(locale) === getCompleteLocale(getDefaultLocale());
}
exports.isDefaultLocale = isDefaultLocale;
function peertubeTranslate(str, translations) {
    return translations && translations[str] ? translations[str] : str;
}
exports.peertubeTranslate = peertubeTranslate;
const possiblePaths = exports.POSSIBLE_LOCALES.map(l => '/' + l);
function is18nPath(path) {
    return possiblePaths.includes(path);
}
exports.is18nPath = is18nPath;
function is18nLocale(locale) {
    return exports.POSSIBLE_LOCALES.includes(locale);
}
exports.is18nLocale = is18nLocale;
function getCompleteLocale(locale) {
    if (!locale)
        return locale;
    if (I18N_LOCALE_ALIAS[locale])
        return I18N_LOCALE_ALIAS[locale];
    return locale;
}
exports.getCompleteLocale = getCompleteLocale;
function getShortLocale(locale) {
    if (locale.includes('-') === false)
        return locale;
    return locale.split('-')[0];
}
exports.getShortLocale = getShortLocale;
function buildFileLocale(locale) {
    return getCompleteLocale(locale);
}
exports.buildFileLocale = buildFileLocale;
