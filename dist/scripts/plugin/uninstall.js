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
    return __awaiter(this, void 0, void 0, function* () {
        yield database_1.initDatabaseModels(true);
        const toUninstall = program['npmName'];
        yield plugin_manager_1.PluginManager.Instance.uninstall(toUninstall);
    });
}
