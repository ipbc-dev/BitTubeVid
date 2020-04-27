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
const Bluebird = require("bluebird");
const node_fetch_1 = require("node-fetch");
const oauth2_server_1 = require("oauth2-server");
const user_1 = require("../lib/user");
const logger_1 = require("../helpers/logger");
const actor_1 = require("../models/activitypub/actor");
const user_2 = require("../models/account/user");
const oauth_client_1 = require("../models/oauth/oauth-client");
const oauth_token_1 = require("../models/oauth/oauth-token");
const constants_1 = require("../initializers/constants");
const config_1 = require("../initializers/config");
const LRUCache = require("lru-cache");
const shared_1 = require("../../shared");
const accessTokenCache = new LRUCache({ max: constants_1.LRU_CACHE.USER_TOKENS.MAX_SIZE });
const userHavingToken = new LRUCache({ max: constants_1.LRU_CACHE.USER_TOKENS.MAX_SIZE });
function deleteUserToken(userId, t) {
    clearCacheByUserId(userId);
    return oauth_token_1.OAuthTokenModel.deleteUserToken(userId, t);
}
exports.deleteUserToken = deleteUserToken;
function clearCacheByUserId(userId) {
    const token = userHavingToken.get(userId);
    if (token !== undefined) {
        accessTokenCache.del(token);
        userHavingToken.del(userId);
    }
}
exports.clearCacheByUserId = clearCacheByUserId;
function clearCacheByToken(token) {
    const tokenModel = accessTokenCache.get(token);
    if (tokenModel !== undefined) {
        userHavingToken.del(tokenModel.userId);
        accessTokenCache.del(token);
    }
}
exports.clearCacheByToken = clearCacheByToken;
function getAccessToken(bearerToken) {
    logger_1.logger.debug('Getting access token (bearerToken: ' + bearerToken + ').');
    if (!bearerToken)
        return Bluebird.resolve(undefined);
    if (accessTokenCache.has(bearerToken))
        return Bluebird.resolve(accessTokenCache.get(bearerToken));
    return oauth_token_1.OAuthTokenModel.getByTokenAndPopulateUser(bearerToken)
        .then(tokenModel => {
        if (tokenModel) {
            accessTokenCache.set(bearerToken, tokenModel);
            userHavingToken.set(tokenModel.userId, tokenModel.accessToken);
        }
        return tokenModel;
    });
}
exports.getAccessToken = getAccessToken;
function getClient(clientId, clientSecret) {
    logger_1.logger.debug('Getting Client (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ').');
    return oauth_client_1.OAuthClientModel.getByIdAndSecret(clientId, clientSecret);
}
exports.getClient = getClient;
function getRefreshToken(refreshToken) {
    logger_1.logger.debug('Getting RefreshToken (refreshToken: ' + refreshToken + ').');
    return oauth_token_1.OAuthTokenModel.getByRefreshTokenAndPopulateClient(refreshToken);
}
exports.getRefreshToken = getRefreshToken;
const USERS_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.USERS;
function generateUntakenUsername(username, email) {
    return __awaiter(this, void 0, void 0, function* () {
        const newUsernameFromEmail = `${(email || '').split('@')[0].toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9._]/g, '').trim()}`;
        let newUsernameFromName = `${(username || newUsernameFromEmail).toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9._]/g, '').trim()}`;
        newUsernameFromName = newUsernameFromEmail;
        let testUser = {};
        do {
            if (newUsernameFromName.length >= USERS_CONSTRAINTS_FIELDS.USERNAME.min) {
                testUser = yield user_2.UserModel.loadByUsername(newUsernameFromName);
                if (!testUser) {
                    testUser = yield actor_1.ActorModel.loadLocalByName(newUsernameFromName);
                }
                if (!testUser) {
                    break;
                }
            }
            newUsernameFromName = newUsernameFromName + `${Math.floor(Math.random() * 10)}`;
        } while (testUser);
        return newUsernameFromName;
    });
}
function getUserFirebase(usernameOrEmail, password, user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (usernameOrEmail.indexOf('@') === -1) {
            return null;
        }
        const userResult = yield node_fetch_1.default('https://us-central1-bittube-airtime-extension.cloudfunctions.net/verifyPassword', {
            headers: {
                'User-Agent': `PeerTube/${constants_1.PEERTUBE_VERSION} (+${constants_1.WEBSERVER.URL})`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: usernameOrEmail, password }),
            method: 'POST'
        }).then(response => response.json());
        if (userResult.success && userResult.user && userResult.decodedIdToken) {
            const email = userResult.user.email;
            const firebaseInfo = userResult.decodedIdToken.firebase;
            if (firebaseInfo && firebaseInfo.identities && firebaseInfo.sign_in_provider) {
                if (['google.com', 'facebook.com', 'twitter.com'].indexOf(firebaseInfo.sign_in_provider) !== -1) {
                    if (firebaseInfo.identities[firebaseInfo.sign_in_provider] && firebaseInfo.identities[firebaseInfo.sign_in_provider].length) {
                        userResult.user.emailVerified = true;
                    }
                }
            }
            const emailVerified = userResult.user.emailVerified || false;
            const userDisplayName = userResult.user.displayName || undefined;
            if (!user) {
                const userData = {
                    username: yield generateUntakenUsername(userDisplayName, email),
                    email,
                    password,
                    role: shared_1.UserRole.USER,
                    emailVerified: config_1.CONFIG.SIGNUP.REQUIRES_EMAIL_VERIFICATION ? emailVerified : null,
                    nsfwPolicy: config_1.CONFIG.INSTANCE.DEFAULT_NSFW_POLICY,
                    videoQuota: config_1.CONFIG.USER.VIDEO_QUOTA,
                    videoQuotaDaily: config_1.CONFIG.USER.VIDEO_QUOTA_DAILY
                };
                const userToCreate = new user_2.UserModel(userData);
                const userCreationResult = yield user_1.createUserAccountAndChannelAndPlaylist({
                    userToCreate,
                    userDisplayName
                });
                user = userCreationResult.user;
            }
            if (user.blocked)
                throw new oauth2_server_1.AccessDeniedError('User is blocked.');
            if (config_1.CONFIG.SIGNUP.REQUIRES_EMAIL_VERIFICATION && user.emailVerified === false) {
                throw new oauth2_server_1.AccessDeniedError('User email is not verified.');
            }
            return user;
        }
        return null;
    });
}
function getUser(usernameOrEmail, password) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.debug('Getting User (username/email: ' + usernameOrEmail + ', password: ******).');
        const user = yield user_2.UserModel.loadByUsernameOrEmail(usernameOrEmail);
        if (!user)
            return getUserFirebase(usernameOrEmail, password, null);
        const passwordMatch = yield user.isPasswordMatch(password);
        if (passwordMatch === false)
            return getUserFirebase(usernameOrEmail, password, user);
        if (user.blocked)
            throw new oauth2_server_1.AccessDeniedError('User is blocked.');
        if (config_1.CONFIG.SIGNUP.REQUIRES_EMAIL_VERIFICATION && user.emailVerified === false) {
            throw new oauth2_server_1.AccessDeniedError('User email is not verified.');
        }
        return user;
    });
}
exports.getUser = getUser;
function revokeToken(tokenInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield oauth_token_1.OAuthTokenModel.getByRefreshTokenAndPopulateUser(tokenInfo.refreshToken);
        if (token) {
            clearCacheByToken(token.accessToken);
            token.destroy()
                .catch(err => logger_1.logger.error('Cannot destroy token when revoking token.', { err }));
        }
        const expiredToken = token;
        expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z');
        return expiredToken;
    });
}
exports.revokeToken = revokeToken;
function saveToken(token, client, user) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.debug('Saving token ' + token.accessToken + ' for client ' + client.id + ' and user ' + user.id + '.');
        const tokenToCreate = {
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            oAuthClientId: client.id,
            userId: user.id
        };
        const tokenCreated = yield oauth_token_1.OAuthTokenModel.create(tokenToCreate);
        return Object.assign(tokenCreated, { client, user });
    });
}
exports.saveToken = saveToken;
