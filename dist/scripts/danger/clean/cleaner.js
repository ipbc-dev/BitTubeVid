"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const register_ts_paths_1 = require("../../../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const Promise = require("bluebird");
const rimraf = require("rimraf");
const database_1 = require("../../../server/initializers/database");
const config_1 = require("../../../server/initializers/config");
database_1.initDatabaseModels(true)
    .then(() => {
    return database_1.sequelizeTypescript.drop();
})
    .then(() => {
    console.info('Tables of %s deleted.', config_1.CONFIG.DATABASE.DBNAME);
    const STORAGE = config_1.CONFIG.STORAGE;
    Promise.mapSeries(Object.keys(STORAGE), storage => {
        const storageDir = STORAGE[storage];
        return new Promise((res, rej) => {
            rimraf(storageDir, err => {
                if (err)
                    return rej(err);
                console.info('%s deleted.', storageDir);
                return res();
            });
        });
    })
        .then(() => process.exit(0));
});
