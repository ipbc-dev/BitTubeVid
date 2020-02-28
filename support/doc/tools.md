# CLI tools guide

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Remote Tools](#remote-tools)
  - [Dependencies](#dependencies)
  - [Installation](#installation)
  - [CLI wrapper](#cli-wrapper)
    - [peertube-import-videos.js](#peertube-import-videosjs)
    - [peertube-upload.js](#peertube-uploadjs)
    - [peertube-watch.js](#peertube-watchjs)
    - [peertube-plugins.js](#peertube-pluginsjs)
    - [peertube-redundancy.js](#peertube-redundancyjs)
- [Server tools](#server-tools)
  - [parse-log](#parse-log)
  - [create-transcoding-job.js](#create-transcoding-jobjs)
  - [create-import-video-file-job.js](#create-import-video-file-jobjs)
  - [prune-storage.js](#prune-storagejs)
  - [optimize-old-videos.js](#optimize-old-videosjs)
  - [update-host.js](#update-hostjs)
  - [reset-password.js](#reset-passwordjs)
  - [plugin install/uninstall](#plugin-installuninstall)
  - [REPL (Read Eval Print Loop)](#repl-read-eval-print-loop)
    - [.help](#help)
    - [Lodash example](#lodash-example)
    - [YoutubeDL example](#youtubedl-example)
    - [Models examples](#models-examples)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Remote Tools

You need at least 512MB RAM to run the script.
Scripts can be launched directly from a BitTubeVid server, or from a separate server, even a desktop PC.
You need to follow all the following steps even if you are on a BitTubeVid server (including cloning the git repository in a different directory than your production installation because the scripts utilize non-production dependencies).

### Dependencies

Install the [BitTubeVid dependencies](dependencies.md) except PostgreSQL and Redis.
BitTubeVid only supports NodeJS 10.x.

### Installation

Clone the BitTubeVid repo to get the latest version (even if you are on your BitTubeVid server):

```
$ git clone https://github.com/ipbc-dev/BitTubeVid.git
$ CLONE="$(pwd)/BitTubeVid"
$ cd ${CLONE}
```

Install dependencies and build CLI tools:

```
$ NOCLIENT=1 yarn install --pure-lockfile
$ npm run setup:cli
```

### CLI wrapper

The wrapper provides a convenient interface to the following scripts.
You can access it as `bittube` adding an alias in your `.bashrc` like `alias bittube="cd /your/bittube/directory/ && node ./dist/server/tools/bittube.js"` (you have to keep the `cd` command):

```
  Usage: bittube [command] [options]

  Options:

    -v, --version         output the version number
    -h, --help            output usage information

  Commands:

    auth [action]         register your accounts on remote instances to use them with other commands
    upload|up             upload a video
    import-videos|import  import a video from a streaming platform
    watch|w               watch a video in the terminal ✩°｡⋆
    repl                  initiate a REPL to access internals
    plugins|p [action]    manage instance plugins
    redundancy|r [action] manage video redundancies
    help [cmd]            display help for [cmd]
```

The wrapper can keep track of instances you have an account on. We limit to one account per instance for now.

```bash
$ bittube auth add -u 'BITTUBE_URL' -U 'BITTUBE_USER' --password 'BITTUBE_PASSWORD'
$ bittube auth list
┌──────────────────────────────┬──────────────────────────────┐
│ instance                     │ login                        │
├──────────────────────────────┼──────────────────────────────┤
│ 'BITTUBE_URL'                │ 'BITTUBE_USER'               │
└──────────────────────────────┴──────────────────────────────┘
```

You can now use that account to upload videos without feeding the same parameters again.

```bash
$ bittube up <videoFile>
```

And now that your video is online, you can watch it from the confort of your terminal (use `bittube watch --help` to see the supported players):

```bash
$ bittube watch https://bittube.video/videos/watch/aedd1c35-ce03-44aa-8fb1-bc4fe45d1023
```

To list, install, uninstall dynamically plugins/themes of an instance:

```bash
$ bittube plugins list
$ bittube plugins install --path /local/plugin/path
$ bittube plugins install --npm-name peertube-plugin-myplugin
$ bittube plugins uninstall --npm-name peertube-plugin-myplugin
```

#### bittube-import-videos.js

You can use this script to import videos from all [supported sites of youtube-dl](https://rg3.github.io/youtube-dl/supportedsites.html) into BitTubeVid.
Be sure you own the videos or have the author's authorization to do so.

```sh
$ node dist/server/tools/bittube-import-videos.js \
    -u 'BITTUBE_URL' \
    -U 'BITTUBE_USER' \
    --password 'BITTUBE_PASSWORD' \
    --target-url 'TARGET_URL'
```

* `BITTUBE_URL` : the full URL of your BitTubeVid server where you want to import, eg: https://bittube.video
* `BITTUBE_USER` : your BitTube account where videos will be uploaded
* `BITTUBE_PASSWORD` : password of your BitTube account (if `--password BITTUBE_PASSWORD` is omitted, you will be prompted for it)
* `TARGET_URL` : the target url you want to import. Examples:
  * YouTube:
    * Channel: https://www.youtube.com/channel/ChannelId
    * User https://www.youtube.com/c/UserName or https://www.youtube.com/user/UserName
    * Video https://www.youtube.com/watch?v=blabla
  * Vimeo: https://vimeo.com/xxxxxx
  * Dailymotion: https://www.dailymotion.com/xxxxx

The script will get all public videos from Youtube, download them and upload to BitTube.
Already downloaded videos will not be uploaded twice, so you can run and re-run the script in case of crash, disconnection...

Videos will be publicly available after transcoding (you can see them before that in your account on the web interface).

**NB**: If you want to synchronize a Youtube channel to your BitTube instance (ensure you have the agreement from the author),
you can add a [crontab rule](https://help.ubuntu.com/community/CronHowto) (or an equivalent of your OS) and insert
these rules (ensure to customize them to your needs):

```
# Update youtube-dl every day at midnight
0 0 * * * /usr/bin/npm rebuild youtube-dl --prefix /PATH/TO/BITTUBE/

# Synchronize the YT channel every sunday at 22:00 all the videos published since last monday included
0 22 * * 0 /usr/bin/node /PATH/TO/BITTUBE/dist/server/tools/bittube-import-videos.js -u '__BITTUBE_URL__' -U '__USER__' --password '__PASSWORD__' --target-url 'https://www.youtube.com/channel/___CHANNEL__' --since $(date --date="-6 days" +%Y-%m-%d)
```

Also you may want to subscribe to the BitTube channel in order to manually check the synchronization is successful.

#### bittube-upload.js

You can use this script to import videos directly from the CLI.

Videos will be publicly available after transcoding (you can see them before that in your account on the web interface).

```
$ cd ${CLONE}
$ node dist/server/tools/bittube-upload.js --help
```

#### bittube-watch.js

You can use this script to play videos directly from the CLI.

It provides support for different players:

- ascii (default ; plays in ascii art in your terminal!)
- mpv
- mplayer
- vlc
- stdout
- xbmc
- airplay
- chromecast


#### peertube-plugins.js

Install/update/uninstall or list local or NPM BitTube plugins:

```
$ cd ${CLONE}
$ node dist/server/tools/bittube-plugins.js --help
$ node dist/server/tools/bittube-plugins.js list --help
$ node dist/server/tools/bittube-plugins.js install --help
$ node dist/server/tools/bittube-plugins.js update --help
$ node dist/server/tools/bittube-plugins.js uninstall --help

$ node dist/server/tools/bittube-plugins.js install --path /my/plugin/path
$ node dist/server/tools/bittube-plugins.js install --npm-name peertube-theme-example
```

#### bittube-redundancy.js

Manage (list/add/remove) video redundancies:

To list your videos that are duplicated by remote instances:

```
$ node dist/server/tools/bittube.js redundancy list-remote-redundancies
```

To list remote videos that your instance duplicated:

```
$ node dist/server/tools/bittube.js redundancy list-my-redundancies
```

To duplicate a specific video in your redundancy system:

```
$ node dist/server/tools/bittube.js redundancy add --video 823
```

To remove a video redundancy:

```
$ node dist/server/tools/bittube.js redundancy remove --video 823
```

## Server tools

These scripts should be run on the server, in `bittube-latest` directory.

### parse-log

To parse BitTubeVid last log file:

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run parse-log -- --level info
```

`--level` is optional and could be `info`/`warn`/`error`

### create-transcoding-job.js

You can use this script to force transcoding of an existing video. BitTubeVid needs to be running.

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run create-transcoding-job -- -v [videoUUID]
```

Or to transcode to a specific resolution:
```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run create-transcoding-job -- -v [videoUUID] -r [resolution]
```

To generate an HLS playlist for a video:

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run create-transcoding-job -- --generate-hls -v [videoUUID]
```

### create-import-video-file-job.js

You can use this script to import a video file to replace an already uploaded file or to add a new resolution to a video. BitTubeVid needs to be running.

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run create-import-video-file-job -- -v [videoUUID] -i [videoFile]
```

### prune-storage.js

Some transcoded videos or shutdown at a bad time can leave some unused files on your storage.
Stop BitTubeVid and delete these files (a confirmation will be demanded first):

```
$ sudo systemctl stop bittube && sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run prune-storage
```

### optimize-old-videos.js

Before version v1.0.0-beta.16, BitTubeVid did not specify a bitrate for the
transcoding of uploaded videos. This means that videos might be encoded into
very large files that are too large for streaming. This script re-transcodes
these videos so that they can be watched properly, even on slow connections.

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run optimize-old-videos
```


### update-host.js

If you started BitTubeVid with a domain, and then changed it you will have
invalid torrent files and invalid URLs in your database. To fix this, you have
to run:

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run update-host
```

### reset-password.js

To reset a user password from CLI, run:

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run reset-password -- -u target_username
```


### plugin install/uninstall

The difference with `bittube plugins` CLI is that these scripts can be used even if BitTubeVid is not running.
If BitTubeVid is running, you need to restart it for the changes to take effect (whereas with `bittube plugins` CLI, plugins/themes are dynamically loaded on the server).

To install/update a plugin or a theme from the disk:

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run plugin:install -- --plugin-path /local/plugin/path
```

From NPM:

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run plugin:install -- --npm-name peertube-plugin-myplugin
```

To uninstall a plugin or a theme:

```
$ sudo -u bittube NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run plugin:uninstall -- --npm-name peertube-plugin-myplugin
```

### REPL ([Read Eval Print Loop](https://nodejs.org/docs/latest-v10.x/api/repl.html))

If you want to interact with the application libraries and objects even when BitTubeVid is not running, there is a REPL for that.

usage: `node ./dist/server/tools/bittube-repl.js`

"The default evaluator will, by default, assign the result of the most recently evaluated expression to the special variable `_` (underscore). Explicitly setting `_` to a value will disable this behavior."

- type `.help` to list commands available in the repl, notice it starts with a dot
- type `.exit` to exit, note that you still have to press CTRL-C to actually exit, or press CTRL-C (3 times) without typing `.exit` to exit
- type `context` to list all available objects and libraries in the context, note: `Promise` is also available but it's not listed in the context, in case you need promises for something
- type `env` to see the loaded environment variables
- type `path` to access path library
- type `lodash` to access lodash library
- type `uuidv1` to access uuid/v1 library
- type `uuidv3` to access uuid/v3 library
- type `uuidv4` to access uuid/v4 library
- type `uuidv5` to access uuid/v5 library
- type `YoutubeDL` to access youtube-dl library
- type `cli` to access the cli helpers object
- type `logger` to access the logger; if you log to it, it will write to stdout and to the bittube.log file
- type `constants` to access the constants loaded by the server
- type `coreUtils` to access the core-utils helpers object
- type `ffmpegUtils` to access the ffmpeg-utils helpers object
- type `peertubeCryptoUtils` to access the peertube-crypto helpers object
- type `signupUtils` to access the signup helpers object
- type `utils` to access the utils helpers object
- type `YoutubeDLUtils` to access the youtube-dl helpers object
- type `sequelizeTypescript` to access sequelizeTypescript
- type `modelsUtils` to access the models/utils
- type `models` to access the shortcut to sequelizeTypescript.models
- type `transaction` to access the shortcut to sequelizeTypescript.transaction
- type `query` to access the shortcut to sequelizeTypescript.query
- type `queryInterface` to access the shortcut to sequelizeTypescript.queryInterface

#### .help

```
BitTubeVid [1.0.0] (b10eb595)> .help
.break    Sometimes you get stuck, this gets you out
.clear    Break, and also clear the local context
.editor   Enter editor mode
.exit     Exit the repl
.help     Print this help message
.load     Load JS from a file into the REPL session
.r        Reset REPL
.reset    Reset REPL
.save     Save all evaluated commands in this REPL session to a file
BitTubeVid [1.0.0] (b10eb595)>
```

#### Lodash example

```
BitTubeVid [1.0.0] (b10eb595)> lodash.keys(context)
[ 'global',
  'console',
  'DTRACE_NET_SERVER_CONNECTION',
  'DTRACE_NET_STREAM_END',
  'DTRACE_HTTP_SERVER_REQUEST',
  'DTRACE_HTTP_SERVER_RESPONSE',
  'DTRACE_HTTP_CLIENT_REQUEST',
  'DTRACE_HTTP_CLIENT_RESPONSE',
  'process',
  'Buffer',
  'clearImmediate',
  'clearInterval',
  'clearTimeout',
  'setImmediate',
  'setInterval',
  'setTimeout',
  'XMLHttpRequest',
  'compact2string',
  'module',
  'require',
  'path',
  'repl',
  'context',
  'env',
  'lodash',
  'uuidv1',
  'uuidv3',
  'uuidv4',
  'uuidv5',
  'cli',
  'logger',
  'constants',
  'Sequelize',
  'sequelizeTypescript',
  'modelsUtils',
  'models',
  'transaction',
  'query',
  'queryInterface',
  'YoutubeDL',
  'coreUtils',
  'ffmpegUtils',
  'peertubeCryptoUtils',
  'signupUtils',
  'utils',
  'YoutubeDLUtils' ]
BitTubeVid [1.0.0] (b10eb595)>
```

#### YoutubeDL example
```
YoutubeDL.getInfo('https://www.youtube.com/watch?v=I5ZN289jjDo', function(err, data) {console.log(err, data)})
```

#### Models examples
```
BitTubeVid [1.0.0] (b10eb595)> new models.ActorModel({id: 3}).getVideoChannel().then(function(data){console.log(data.dataValues.name)})
Promise {
  _bitField: 0,
  _fulfillmentHandler0: undefined,
  _rejectionHandler0: undefined,
  _promise0: undefined,
  _receiver0: undefined }
BitTubeVid [1.0.0] (b10eb595)> Main root channel
BitTubeVid [1.0.0] (b10eb595)> let out; new models.UserModel({id: 1}).getAccount().then(function (data) {out = data.dataValues.id})
Promise {
  _bitField: 0,
  _fulfillmentHandler0: undefined,
  _rejectionHandler0: undefined,
  _promise0: undefined,
  _receiver0: undefined }
BitTubeVid [1.0.0] (b10eb595)> out
2
BitTubeVid [1.0.0] (b10eb595)>
```
