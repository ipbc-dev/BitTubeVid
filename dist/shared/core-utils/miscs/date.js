"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isToday(d) {
    const today = new Date();
    return areDatesEqual(d, today);
}
exports.isToday = isToday;
function isYesterday(d) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return areDatesEqual(d, yesterday);
}
exports.isYesterday = isYesterday;
function isThisWeek(d) {
    const minDateOfThisWeek = new Date();
    minDateOfThisWeek.setHours(0, 0, 0);
    let dayOfWeek = minDateOfThisWeek.getDay() - 1;
    if (dayOfWeek < 0)
        dayOfWeek = 6;
    minDateOfThisWeek.setDate(minDateOfThisWeek.getDate() - dayOfWeek);
    return d >= minDateOfThisWeek;
}
exports.isThisWeek = isThisWeek;
function isThisMonth(d) {
    const thisMonth = new Date().getMonth();
    return d.getMonth() === thisMonth;
}
exports.isThisMonth = isThisMonth;
function isLastMonth(d) {
    const now = new Date();
    return getDaysDifferences(now, d) <= 30;
}
exports.isLastMonth = isLastMonth;
function isLastWeek(d) {
    const now = new Date();
    return getDaysDifferences(now, d) <= 7;
}
exports.isLastWeek = isLastWeek;
function areDatesEqual(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}
function getDaysDifferences(d1, d2) {
    return (d1.getTime() - d2.getTime()) / (86400000);
}
