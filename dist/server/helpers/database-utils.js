"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNonExistingModels = exports.afterCommitIfTransaction = exports.updateInstanceWithAnother = exports.transactionRetryer = exports.retryTransactionWrapper = exports.resetSequelizeInstance = void 0;
const retry = require("async/retry");
const logger_1 = require("./logger");
function retryTransactionWrapper(functionToRetry, ...args) {
    return transactionRetryer(callback => {
        functionToRetry.apply(null, args)
            .then((result) => callback(null, result))
            .catch(err => callback(err));
    })
        .catch(err => {
        logger_1.logger.error(`Cannot execute ${functionToRetry.name} with many retries.`, { err });
        throw err;
    });
}
exports.retryTransactionWrapper = retryTransactionWrapper;
function transactionRetryer(func) {
    return new Promise((res, rej) => {
        retry({
            times: 5,
            errorFilter: err => {
                const willRetry = (err.name === 'SequelizeDatabaseError');
                logger_1.logger.debug('Maybe retrying the transaction function.', { willRetry, err });
                return willRetry;
            }
        }, func, (err, data) => err ? rej(err) : res(data));
    });
}
exports.transactionRetryer = transactionRetryer;
function updateInstanceWithAnother(instanceToUpdate, baseInstance) {
    const obj = baseInstance.toJSON();
    for (const key of Object.keys(obj)) {
        instanceToUpdate[key] = obj[key];
    }
}
exports.updateInstanceWithAnother = updateInstanceWithAnother;
function resetSequelizeInstance(instance, savedFields) {
    Object.keys(savedFields).forEach(key => {
        instance[key] = savedFields[key];
    });
}
exports.resetSequelizeInstance = resetSequelizeInstance;
function afterCommitIfTransaction(t, fn) {
    if (t)
        return t.afterCommit(() => fn());
    return fn();
}
exports.afterCommitIfTransaction = afterCommitIfTransaction;
function deleteNonExistingModels(fromDatabase, newModels, t) {
    return fromDatabase.filter(f => !newModels.find(newModel => newModel.hasSameUniqueKeysThan(f)))
        .map(f => f.destroy({ transaction: t }));
}
exports.deleteNonExistingModels = deleteNonExistingModels;
