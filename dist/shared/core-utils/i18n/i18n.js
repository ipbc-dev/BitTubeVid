"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFileLocale = exports.getShortLocale = exports.getCompleteLocale = exports.is18nLocale = exports.is18nPath = exports.peertubeTranslate = exports.isDefaultLocale = exports.getDefaultLocale = exports.POSSIBLE_LOCALES = exports.I18N_LOCALES = exports.LOCALE_FILES = void 0;
exports.LOCALE_FILES = ['player', 'server'];
exports.I18N_LOCALES = {
    'en-US': 'English',
    'ar': 'العربية',
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
    'gl-ES': 'galego',
    'hu-HU': 'magyar',
    'it-IT': 'Italiano',
    'ja-JP': '日本語',
    'kab': 'Taqbaylit',
    'nl-NL': 'Nederlands',
    'oc': 'Occitan',
    'pl-PL': 'Polski',
    'pt-BR': 'Português (Brasil)',
    'pt-PT': 'Português (Portugal)',
    'ru-RU': 'русский',
    'sq': 'Shqip',
    'sv-SE': 'Svenska',
    'th-TH': 'ไทย',
    'vi-VN': 'Tiếng Việt',
    'zh-Hans-CN': '简体中文（中国）',
    'zh-Hant-TW': '繁體中文（台灣）'
};
const I18N_LOCALE_ALIAS = {
    'ar-001': 'ar',
    'ca': 'ca-ES',
    'cs': 'cs-CZ',
    'de': 'de-DE',
    'el': 'el-GR',
    'en': 'en-US',
    'es': 'es-ES',
    'eu': 'eu-ES',
    'fi': 'fi-FI',
    'gl': 'gl-ES',
    'fr': 'fr-FR',
    'hu': 'hu-HU',
    'it': 'it-IT',
    'ja': 'ja-JP',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'pt': 'pt-BR',
    'ru': 'ru-RU',
    'sv': 'sv-SE',
    'th': 'th-TH',
    'vi': 'vi-VN',
    'zh-CN': 'zh-Hans-CN',
    'zh-Hans': 'zh-Hans-CN',
    'zh-Hant': 'zh-Hant-TW',
    'zh-TW': 'zh-Hant-TW',
    'zh': 'zh-Hans-CN'
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
