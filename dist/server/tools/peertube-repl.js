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
const register_ts_paths_1 = require("../helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const repl = require("repl");
const path = require("path");
const _ = require("lodash");
const uuid_1 = require("uuid");
const Sequelize = require("sequelize");
const YoutubeDL = require("youtube-dl");
const database_1 = require("../initializers/database");
const cli = require("../tools/cli");
const logger_1 = require("../helpers/logger");
const constants = require("../initializers/constants");
const modelsUtils = require("../models/utils");
const coreUtils = require("../helpers/core-utils");
const ffmpegUtils = require("../helpers/ffmpeg-utils");
const peertubeCryptoUtils = require("../helpers/peertube-crypto");
const signupUtils = require("../helpers/signup");
const utils = require("../helpers/utils");
const YoutubeDLUtils = require("../helpers/youtube-dl");
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    yield database_1.initDatabaseModels(true);
    const versionCommitHash = yield utils.getServerCommit();
    const initContext = (replServer) => {
        return (context) => {
            const properties = {
                context,
                repl: replServer,
                env: process.env,
                lodash: _,
                path,
                uuidv1: uuid_1.uuidv1,
                uuidv3: uuid_1.uuidv3,
                uuidv4: uuid_1.uuidv4,
                uuidv5: uuid_1.uuidv5,
                cli,
                logger: logger_1.logger,
                constants,
                Sequelize,
                sequelizeTypescript: database_1.sequelizeTypescript,
                modelsUtils,
                models: database_1.sequelizeTypescript.models,
                transaction: database_1.sequelizeTypescript.transaction,
                query: database_1.sequelizeTypescript.query,
                queryInterface: database_1.sequelizeTypescript.getQueryInterface(),
                YoutubeDL,
                coreUtils,
                ffmpegUtils,
                peertubeCryptoUtils,
                signupUtils,
                utils,
                YoutubeDLUtils
            };
            for (const prop in properties) {
                Object.defineProperty(context, prop, {
                    configurable: false,
                    enumerable: true,
                    value: properties[prop]
                });
            }
        };
    };
    const replServer = repl.start({
        prompt: `PeerTube [${cli.version}] (${versionCommitHash})> `
    });
    initContext(replServer)(replServer.context);
    replServer.on('reset', initContext(replServer));
    replServer.on('exit', () => process.exit());
    const resetCommand = {
        help: 'Reset REPL',
        action() {
            this.write('.clear\n');
            this.displayPrompt();
        }
    };
    replServer.defineCommand('reset', resetCommand);
    replServer.defineCommand('r', resetCommand);
});
start()
    .catch((err) => {
    console.error(err);
});
