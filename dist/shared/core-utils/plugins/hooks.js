"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalRunHook = exports.getHookType = void 0;
const tslib_1 = require("tslib");
const miscs_1 = require("../miscs/miscs");
function getHookType(hookName) {
    if (hookName.startsWith('filter:'))
        return 3;
    if (hookName.startsWith('action:'))
        return 2;
    return 1;
}
exports.getHookType = getHookType;
function internalRunHook(handler, hookType, result, params, onError) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            if (hookType === 3) {
                const p = handler(result, params);
                if (miscs_1.isPromise(p))
                    result = yield p;
                else
                    result = p;
                return result;
            }
            const p = handler(params);
            if (hookType === 1) {
                if (miscs_1.isPromise(p))
                    yield p;
                return undefined;
            }
            if (hookType === 2) {
                if (miscs_1.isCatchable(p))
                    p.catch((err) => onError(err));
                return undefined;
            }
        }
        catch (err) {
            onError(err);
        }
        return result;
    });
}
exports.internalRunHook = internalRunHook;
