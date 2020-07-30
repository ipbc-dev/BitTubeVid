"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const database_1 = require("../../server/initializers/database");
const program = require("commander");
const plugin_manager_1 = require("../../server/lib/plugins/plugin-manager");
program
    .option('-n, --npm-name [npmName]', 'Package name to install')
    .parse(process.argv);
if (!program['npmName']) {
    console.error('You need to specify the plugin name.');
    process.exit(-1);
}
run()
    .then(() => process.exit(0))
    .catch(err => {
    console.error(err);
    process.exit(-1);
});
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield database_1.initDatabaseModels(true);
        const toUninstall = program['npmName'];
        yield plugin_manager_1.PluginManager.Instance.uninstall(toUninstall);
    });
}
