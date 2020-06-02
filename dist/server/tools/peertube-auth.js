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
const program = require("commander");
const prompt = require("prompt");
const cli_1 = require("./cli");
const users_1 = require("../helpers/custom-validators/users");
const extra_utils_1 = require("../../shared/extra-utils");
const CliTable3 = require("cli-table3");
function delInstance(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const [settings, netrc] = yield Promise.all([cli_1.getSettings(), cli_1.getNetrc()]);
        const index = settings.remotes.indexOf(url);
        settings.remotes.splice(index);
        if (settings.default === index)
            settings.default = -1;
        yield cli_1.writeSettings(settings);
        delete netrc.machines[url];
        yield netrc.save();
    });
}
function setInstance(url, username, password, isDefault) {
    return __awaiter(this, void 0, void 0, function* () {
        const [settings, netrc] = yield Promise.all([cli_1.getSettings(), cli_1.getNetrc()]);
        if (settings.remotes.indexOf(url) === -1) {
            settings.remotes.push(url);
        }
        if (isDefault || settings.remotes.length === 1) {
            settings.default = settings.remotes.length - 1;
        }
        yield cli_1.writeSettings(settings);
        netrc.machines[url] = { login: username, password };
        yield netrc.save();
    });
}
function isURLaPeerTubeInstance(url) {
    return url.startsWith('http://') || url.startsWith('https://');
}
program
    .name('auth')
    .usage('[command] [options]');
program
    .command('add')
    .description('remember your accounts on remote instances for easier use')
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .option('--default', 'add the entry as the new default')
    .action(options => {
    prompt.override = options;
    prompt.start();
    prompt.get({
        properties: {
            url: {
                description: 'instance url',
                conform: (value) => isURLaPeerTubeInstance(value),
                message: 'It should be an URL (https://peertube.example.com)',
                required: true
            },
            username: {
                conform: (value) => users_1.isUserUsernameValid(value),
                message: 'Name must be only letters, spaces, or dashes',
                required: true
            },
            password: {
                hidden: true,
                replace: '*',
                required: true
            }
        }
    }, (_, result) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield extra_utils_1.getAccessToken(result.url, result.username, result.password);
        }
        catch (err) {
            console.error(err.message);
            process.exit(-1);
        }
        yield setInstance(result.url, result.username, result.password, program['default']);
        process.exit(0);
    }));
});
program
    .command('del <url>')
    .description('unregisters a remote instance')
    .action((url) => __awaiter(void 0, void 0, void 0, function* () {
    yield delInstance(url);
    process.exit(0);
}));
program
    .command('list')
    .description('lists registered remote instances')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const [settings, netrc] = yield Promise.all([cli_1.getSettings(), cli_1.getNetrc()]);
    const table = new CliTable3({
        head: ['instance', 'login'],
        colWidths: [30, 30]
    });
    settings.remotes.forEach(element => {
        if (!netrc.machines[element])
            return;
        table.push([
            element,
            netrc.machines[element].login
        ]);
    });
    console.log(table.toString());
    process.exit(0);
}));
program
    .command('set-default <url>')
    .description('set an existing entry as default')
    .action((url) => __awaiter(void 0, void 0, void 0, function* () {
    const settings = yield cli_1.getSettings();
    const instanceExists = settings.remotes.includes(url);
    if (instanceExists) {
        settings.default = settings.remotes.indexOf(url);
        yield cli_1.writeSettings(settings);
        process.exit(0);
    }
    else {
        console.log('<url> is not a registered instance.');
        process.exit(-1);
    }
}));
program.on('--help', function () {
    console.log('  Examples:');
    console.log();
    console.log('    $ peertube add -u https://peertube.cpy.re -U "PEERTUBE_USER" --password "PEERTUBE_PASSWORD"');
    console.log('    $ peertube add -u https://peertube.cpy.re -U root');
    console.log('    $ peertube list');
    console.log('    $ peertube del https://peertube.cpy.re');
    console.log();
});
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
program.parse(process.argv);
