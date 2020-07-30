"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalRunHook = exports.getHookType = void 0;
const tslib_1 = require("tslib");
const hook_type_enum_1 = require("../../models/plugins/hook-type.enum");
const miscs_1 = require("../miscs/miscs");
function getHookType(hookName) {
    if (hookName.startsWith('filter:'))
        return hook_type_enum_1.HookType.FILTER;
    if (hookName.startsWith('action:'))
        return hook_type_enum_1.HookType.ACTION;
    return hook_type_enum_1.HookType.STATIC;
}
exports.getHookType = getHookType;
function internalRunHook(handler, hookType, result, params, onError) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            if (hookType === hook_type_enum_1.HookType.FILTER) {
                const p = handler(result, params);
                if (miscs_1.isPromise(p))
                    result = yield p;
                else
                    result = p;
                return result;
            }
            const p = handler(params);
            if (hookType === hook_type_enum_1.HookType.STATIC) {
                if (miscs_1.isPromise(p))
                    yield p;
                return undefined;
            }
            if (hookType === hook_type_enum_1.HookType.ACTION) {
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
