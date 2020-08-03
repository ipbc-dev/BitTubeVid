"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.premiumStorageRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const middlewares_1 = require("../../middlewares");
const constants_1 = require("../../initializers/constants");
const shared_1 = require("@server/../shared");
const middlewares_2 = require("@server/middlewares");
const premium_storage_plan_1 = require("../../models/premium-storage-plan");
const user_premium_storage_payments_1 = require("../../models/user-premium-storage-payments");
const fetch = require('node-fetch');
const Headers = fetch.Headers;
const firebaseApiUrl = 'http://localhost:5001/bittube-airtime-extension/us-central1/';
const premiumStorageRouter = express.Router();
exports.premiumStorageRouter = premiumStorageRouter;
premiumStorageRouter.get('/plans', middlewares_1.asyncMiddleware(getPlans));
premiumStorageRouter.get('/get-user-active-payment', middlewares_1.authenticate, middlewares_1.asyncMiddleware(getUserActivePayment));
premiumStorageRouter.get('/get-user-payments', middlewares_1.authenticate, middlewares_1.asyncMiddleware(getUserPayments));
premiumStorageRouter.post('/plan-payment', middlewares_1.authenticate, middlewares_1.asyncMiddleware(userPayPlan));
premiumStorageRouter.get('/billing-info', middlewares_1.authenticate, middlewares_1.asyncMiddleware(getUserBilling));
premiumStorageRouter.post('/delete-plan', middlewares_1.authenticate, middlewares_2.ensureUserHasRight(shared_1.UserRight.ALL), middlewares_1.asyncMiddleware(adminDeletePlan));
premiumStorageRouter.post('/add-plan', middlewares_1.authenticate, middlewares_2.ensureUserHasRight(shared_1.UserRight.ALL), middlewares_1.asyncMiddleware(adminAddPlan));
premiumStorageRouter.post('/update-plan', middlewares_1.authenticate, middlewares_2.ensureUserHasRight(shared_1.UserRight.ALL), middlewares_1.asyncMiddleware(adminUpdatePlan));
function adminUpdatePlan(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            if (body.id === undefined ||
                typeof (body.id) !== 'number') {
                throw Error(`Undefined or invalid id ${body.id}`);
            }
            if (body === undefined ||
                body.id === undefined ||
                body.name === undefined ||
                body.quota === undefined ||
                body.dailyQuota === undefined ||
                body.duration === undefined ||
                body.expiration === undefined ||
                body.priceTube === undefined ||
                body.active === undefined) {
                throw Error(`Undefined or invalid body parameters ${body}`);
            }
            const apiReqBody = {
                id: body.tubePayId,
                host: constants_1.WEBSERVER.URL,
                auth: req.headers.authorization,
                title: body.name,
                validFor: parseInt(body.expiration),
                price: body.priceTube
            };
            const firebaseApiRes = yield fetch(firebaseApiUrl + 'peertubeModifyProduct', {
                method: 'post',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(apiReqBody)
            });
            const firebaseApiResult = yield firebaseApiRes.json();
            if (firebaseApiResult.success) {
                const updateResult = yield premium_storage_plan_1.PremiumStoragePlanModel.updatePlan(body.id, body.name, body.quota, body.dailyQuota, body.duration, body.expiration, body.priceTube, body.active);
                return res.json({ success: true, added: updateResult });
            }
            else {
                return res.json({ success: false, error: firebaseApiResult });
            }
        }
        catch (err) {
            return res.json({ success: false, error: err.message });
        }
    });
}
function adminAddPlan(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            if (body === undefined ||
                body.name === undefined ||
                body.quota === undefined ||
                body.dailyQuota === undefined ||
                body.duration === undefined ||
                body.expiration === undefined ||
                body.priceTube === undefined ||
                body.active === undefined) {
                throw Error(`Undefined or invalid body parameters ${body}`);
            }
            body.host = constants_1.WEBSERVER.URL;
            body.auth = req.headers.authorization;
            const firebaseApiRes = yield fetch(firebaseApiUrl + 'peertubeAddProduct', {
                method: 'post',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(body)
            });
            const firebaseApiResult = yield firebaseApiRes.json();
            if (firebaseApiResult.success) {
                const addResult = yield premium_storage_plan_1.PremiumStoragePlanModel.addPlan(body.name, body.quota, body.dailyQuota, body.duration, body.expiration, body.priceTube, body.active, firebaseApiResult.product.id, firebaseApiResult.product.secret, firebaseApiResult.product.ownerContentName);
                return res.json({ success: true, added: addResult, firebase: firebaseApiResult });
            }
            else {
                return res.json({ success: false, error: 'BitTube-Airtime-extension-server did not respond in time' });
            }
        }
        catch (err) {
            return res.json({ success: false, error: err.message });
        }
    });
}
function adminDeletePlan(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            if (body.planId === undefined ||
                typeof (body.planId) !== 'number' ||
                body.tubePayId === undefined ||
                typeof (body.tubePayId) !== 'string') {
                throw Error(`Undefined or invalid id ${body.planId} - ${body.tubePayId}`);
            }
            const apiReqBody = {
                id: body.tubePayId,
                host: constants_1.WEBSERVER.URL,
                auth: req.headers.authorization
            };
            const firebaseApiRes = yield fetch(firebaseApiUrl + 'peertubeDeleteProduct', {
                method: 'post',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(apiReqBody)
            });
            const firebaseApiResult = yield firebaseApiRes.json();
            const deleteResult = yield premium_storage_plan_1.PremiumStoragePlanModel.removePlan(body.planId);
            const deleteResponse = deleteResult;
            return res.json({ success: true, deleted: deleteResponse, firebase: firebaseApiResult });
        }
        catch (err) {
            return res.json({ success: false, error: err.message });
        }
    });
}
function getUserBilling(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const user = res.locals.oauth.token.User;
            const userId = user.Account.id;
            const billingResult = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.getUserPayments(userId);
            const billingResponse = billingResult.map(bill => bill.toJSON());
            return res.json({ success: true, billing: billingResponse });
        }
        catch (err) {
            return res.json({ success: false, error: err.message });
        }
    });
}
function getPlans(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const plansResult = yield premium_storage_plan_1.PremiumStoragePlanModel.getPlans();
            const plansResponse = plansResult.map(plan => plan.toJSON());
            return res.json({ success: true, plans: plansResponse });
        }
        catch (err) {
            return res.json({ success: false, error: err.message });
        }
    });
}
function getPlansInfo() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const plansResult = yield premium_storage_plan_1.PremiumStoragePlanModel.getPlans();
            const plansResponse = plansResult.map(plan => plan.toJSON());
            return { success: true, data: plansResponse };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    });
}
function getUserPayments(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const user = res.locals.oauth.token.User;
            const userId = user.Account.id;
            const paymentsResult = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.getUserPayments(userId);
            const paymentsResponse = paymentsResult.map(payment => payment.toJSON());
            if (paymentsResponse !== undefined && paymentsResponse !== null) {
                return res.json({ success: true, data: paymentsResponse });
            }
            else {
                throw new Error('Something went wrong getting getUserPayments!');
            }
        }
        catch (err) {
            return res.json({ success: false, error: err.message });
        }
    });
}
function getUserActivePayment(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const user = res.locals.oauth.token.User;
            const userId = user.Account.id;
            const paymentResult = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.getUserActivePayment(userId);
            const paymentResponse = paymentResult.map(payment => payment.toJSON());
            if (paymentResponse !== undefined && paymentResponse !== null) {
                return res.json({ success: true, data: paymentResponse });
            }
            else {
                throw new Error('Something went wrong getting getUserActivePayment!');
            }
        }
        catch (err) {
            return res.json({ success: false, error: err.message });
        }
    });
}
function getAllActivePayments(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const user = res.locals.oauth.token.User;
            console.log(user);
            const paymentResult = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.getAllActivePayments();
            const paymentResponse = paymentResult.map(payment => payment.toJSON());
            if (paymentResponse !== undefined && paymentResponse !== null) {
                return res.json({ success: true, data: paymentResponse });
            }
            else {
                throw new Error('Something went wrong getting getAllActivePayments!');
            }
        }
        catch (err) {
            return res.json({ success: false, error: err.message });
        }
    });
}
function userPayPlan(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const userToUpdate = res.locals.oauth.token.User;
            const userId = userToUpdate.Account.id;
            const body = req.body;
            const plansInfo = yield getPlansInfo();
            if (plansInfo.success === false) {
                throw new Error('There are not premium plans that you can pay in this instance');
            }
            let chosenPlan = null;
            for (var i = 0; i < plansInfo.data.length; i++) {
                const plan = plansInfo.data[i];
                if (parseInt(plan['id']) === parseInt(body.planId)) {
                    chosenPlan = plan;
                }
            }
            if (chosenPlan === null) {
                throw new Error(`This plan does not exist`);
            }
            if (body.planId === undefined || (typeof body.planId !== 'number' && typeof body.planId !== 'string')) {
                throw new Error(`Undefined or incorrect planId`);
            }
            if (body.priceTube === undefined || (typeof body.planId !== 'number' && typeof body.planId !== 'string') || parseFloat(body.priceTube) !== parseFloat(chosenPlan.priceTube)) {
                throw new Error(`Undefined or incorrect priceTube body:${parseFloat(body.priceTube)}  chosen:${parseFloat(chosenPlan.priceTube)}`);
            }
            if (body.duration === undefined || (typeof body.planId !== 'number' && typeof body.planId !== 'string') || parseInt(body.duration) !== parseInt(chosenPlan.duration)) {
                throw new Error('Undefined or incorrect duration');
            }
            const userActualPlanResp = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.getUserActivePayment(userId);
            const userActualPlans = userActualPlanResp.map(plan => plan.toJSON());
            const userActualPlan = userActualPlans.length > 0 ? userActualPlans[userActualPlans.length - 1] : null;
            let createData = {};
            let extended = true;
            if (userActualPlan !== null) {
                const prevExpDate = Date.parse(userActualPlan['dateTo']);
                createData = {
                    userId: userId,
                    planId: body.planId,
                    dateFrom: Date.now(),
                    dateTo: prevExpDate + parseInt(body.duration),
                    priceTube: body.priceTube,
                    duration: body.duration,
                    quota: chosenPlan.quota,
                    dailyQuota: chosenPlan.dailyQuota
                };
                if (userActualPlan['planId'] > body.planId) {
                    throw new Error("It's not possible to downgrade a plan before It's finished");
                }
            }
            else {
                extended = false;
                createData = {
                    userId: userId,
                    planId: body.planId,
                    dateFrom: Date.now(),
                    dateTo: Date.now() + parseInt(body.duration),
                    priceTube: body.priceTube,
                    duration: body.duration,
                    quota: chosenPlan.quota,
                    dailyQuota: chosenPlan.dailyQuota
                };
            }
            const firebaseApiResult = { success: true };
            if (firebaseApiResult.success) {
                const paymentResult = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.create(createData);
                const paymentResponse = paymentResult.toJSON();
                userToUpdate.videoQuota = chosenPlan.quota;
                userToUpdate.videoQuotaDaily = chosenPlan.dailyQuota;
                userToUpdate.premiumStorageActive = true;
                const updateUserResult = yield userToUpdate.save();
                if (updateUserResult === undefined && updateUserResult === null) {
                    throw new Error('Something went wrong updating user quota and dailyQuota');
                }
                else {
                    if (userActualPlan !== null) {
                        const deactivatePreviousPlan = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.deactivateUserPayment(userActualPlan['id']);
                        if (deactivatePreviousPlan[0] !== 1) {
                            return res.json({ success: true, extended: extended, data: paymentResponse, deactivatePreviousPlanWarning: deactivatePreviousPlan });
                        }
                    }
                }
                return res.json({ success: true, extended: extended, data: paymentResponse });
            }
            else {
                return res.json({ success: false, error: firebaseApiResult });
            }
        }
        catch (err) {
            return res.json({ success: false, error: err.message });
        }
    });
}
