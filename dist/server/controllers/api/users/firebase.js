"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../../initializers/config");
const constants_1 = require("../../../initializers/constants");
const account_1 = require("../../../models/account/account");
const user_1 = require("../../../models/account/user");
const avatar_1 = require("../../../lib/avatar");
const downloader = require("image-downloader");
const express = require("express");
const JWT = require("jsonwebtoken");
const node_fetch_1 = require("node-fetch");
const firebaseRouter = express.Router();
exports.firebaseRouter = firebaseRouter;
firebaseRouter.post('/firebase/avatar/sync', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, photoURL } = req.body;
        if (typeof token !== 'string' || typeof photoURL !== 'string' || !token.length || !photoURL.length)
            throw new Error('Invalid input.');
        const decoded = JWT.decode(token);
        const userResult = yield node_fetch_1.default('https://us-central1-bittube-airtime-extension.cloudfunctions.net/verifyPassword', {
            headers: {
                'User-Agent': `PeerTube/${constants_1.PEERTUBE_VERSION} (+${constants_1.WEBSERVER.URL})`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: decoded.email, password: token }),
            method: 'POST'
        }).then(response => response.json());
        if (!userResult.success)
            throw new Error('Invalid authentication.');
        const user = yield user_1.UserModel.loadByEmail(decoded.email);
        if (!user)
            throw new Error('User not found.');
        const userAccount = yield account_1.AccountModel.load(user.Account.id);
        if (!userAccount)
            throw new Error('User account not found.');
        const { filename } = yield downloader.image({ url: photoURL, dest: config_1.CONFIG.STORAGE.TMP_DIR });
        const multerFile = { filename: filename.split('/').pop(), path: filename };
        yield avatar_1.updateActorAvatarFile(multerFile, userAccount);
        return res.send({ success: true, mssg: 'Avatar changed.' });
    }
    catch (error) {
        return res.send({ success: false, error: error.message });
    }
}));
