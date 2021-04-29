"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const program = require("commander");
const plugin_type_1 = require("../../shared/models/plugins/plugin.type");
const plugins_1 = require("../../shared/extra-utils/server/plugins");
const cli_1 = require("./cli");
const path_1 = require("path");
const CliTable3 = require("cli-table3");
program
    .name('plugins')
    .usage('[command] [options]');
program
    .command('list')
    .description('List installed plugins')
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .option('-t, --only-themes', 'List themes only')
    .option('-P, --only-plugins', 'List plugins only')
    .action(() => pluginsListCLI());
program
    .command('install')
    .description('Install a plugin or a theme')
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .option('-P --path <path>', 'Install from a path')
    .option('-n, --npm-name <npmName>', 'Install from npm')
    .action((options, command) => installPluginCLI(command, options));
program
    .command('update')
    .description('Update a plugin or a theme')
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .option('-P --path <path>', 'Update from a path')
    .option('-n, --npm-name <npmName>', 'Update from npm')
    .action((options, command) => updatePluginCLI(command, options));
program
    .command('uninstall')
    .description('Uninstall a plugin or a theme')
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .option('-n, --npm-name <npmName>', 'NPM plugin/theme name')
    .action((options, command) => uninstallPluginCLI(command, options));
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
program.parse(process.argv);
const options = program.opts();
function pluginsListCLI() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { url, username, password } = yield cli_1.getServerCredentials(program);
        const accessToken = yield cli_1.getAdminTokenOrDie(url, username, password);
        let pluginType;
        if (options.onlyThemes)
            pluginType = plugin_type_1.PluginType.THEME;
        if (options.onlyPlugins)
            pluginType = plugin_type_1.PluginType.PLUGIN;
        const res = yield plugins_1.listPlugins({
            url,
            accessToken,
            start: 0,
            count: 100,
            sort: 'name',
            pluginType
        });
        const plugins = res.body.data;
        const table = new CliTable3({
            head: ['name', 'version', 'homepage'],
            colWidths: [50, 10, 50]
        });
        for (const plugin of plugins) {
            const npmName = plugin.type === plugin_type_1.PluginType.PLUGIN
                ? 'peertube-plugin-' + plugin.name
                : 'peertube-theme-' + plugin.name;
            table.push([
                npmName,
                plugin.version,
                plugin.homepage
            ]);
        }
        console.log(table.toString());
        process.exit(0);
    });
}
function installPluginCLI(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!options.path && !options.npmName) {
            console.error('You need to specify the npm name or the path of the plugin you want to install.\n');
            program.outputHelp();
            process.exit(-1);
        }
        if (options.path && !path_1.isAbsolute(options.path)) {
            console.error('Path should be absolute.');
            process.exit(-1);
        }
        const { url, username, password } = yield cli_1.getServerCredentials(command);
        const accessToken = yield cli_1.getAdminTokenOrDie(url, username, password);
        try {
            yield plugins_1.installPlugin({
                url,
                accessToken,
                npmName: options.npmName,
                path: options.path
            });
        }
        catch (err) {
            console.error('Cannot install plugin.', err);
            process.exit(-1);
        }
        console.log('Plugin installed.');
        process.exit(0);
    });
}
function updatePluginCLI(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!options.path && !options.npmName) {
            console.error('You need to specify the npm name or the path of the plugin you want to update.\n');
            program.outputHelp();
            process.exit(-1);
        }
        if (options.path && !path_1.isAbsolute(options.path)) {
            console.error('Path should be absolute.');
            process.exit(-1);
        }
        const { url, username, password } = yield cli_1.getServerCredentials(command);
        const accessToken = yield cli_1.getAdminTokenOrDie(url, username, password);
        try {
            yield plugins_1.updatePlugin({
                url,
                accessToken,
                npmName: options.npmName,
                path: options.path
            });
        }
        catch (err) {
            console.error('Cannot update plugin.', err);
            process.exit(-1);
        }
        console.log('Plugin updated.');
        process.exit(0);
    });
}
function uninstallPluginCLI(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!options.npmName) {
            console.error('You need to specify the npm name of the plugin/theme you want to uninstall.\n');
            program.outputHelp();
            process.exit(-1);
        }
        const { url, username, password } = yield cli_1.getServerCredentials(command);
        const accessToken = yield cli_1.getAdminTokenOrDie(url, username, password);
        try {
            yield plugins_1.uninstallPlugin({
                url,
                accessToken,
                npmName: options.npmName
            });
        }
        catch (err) {
            console.error('Cannot uninstall plugin.', err);
            process.exit(-1);
        }
        console.log('Plugin uninstalled.');
        process.exit(0);
    });
}
