"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBlacklistSort = exports.setDefaultVideoRedundanciesSort = exports.setDefaultSearchSort = exports.setDefaultSort = void 0;
const setDefaultSort = setDefaultSortFactory('-createdAt');
exports.setDefaultSort = setDefaultSort;
const setDefaultVideoRedundanciesSort = setDefaultSortFactory('name');
exports.setDefaultVideoRedundanciesSort = setDefaultVideoRedundanciesSort;
const setDefaultSearchSort = setDefaultSortFactory('-match');
exports.setDefaultSearchSort = setDefaultSearchSort;
function setBlacklistSort(req, res, next) {
    const newSort = { sortModel: undefined, sortValue: '' };
    if (!req.query.sort)
        req.query.sort = '-createdAt';
    if (req.query.sort === '-createdAt' || req.query.sort === 'createdAt' ||
        req.query.sort === '-id' || req.query.sort === 'id') {
        newSort.sortModel = undefined;
    }
    else {
        newSort.sortModel = 'Video';
    }
    newSort.sortValue = req.query.sort;
    req.query.sort = newSort;
    return next();
}
exports.setBlacklistSort = setBlacklistSort;
function setDefaultSortFactory(sort) {
    return (req, res, next) => {
        if (!req.query.sort)
            req.query.sort = sort;
        return next();
    };
}
