# Production guide

  * [Installation](#installation)
  * [Upgrade](#upgrade)

## Installation

Please don't install BitTubeVid for production on a device behind a low bandwidth connection (example: your ADSL link).
If you want information about the appropriate hardware to run bittube, please see the [FAQ](https://github.com/ipbc-dev/BitTubeVid/blob/tube/FAQ.md#should-i-have-a-big-server-to-run-bittube).

### Dependencies

**Follow the steps of the [dependencies guide](dependencies.md).**

### BitTubeVid user

Create a `bittube` user with `/var/www/bittube` home:

```
$ sudo useradd -m -d /var/www/bittube -s /bin/bash -p bittube bittube
```

Set its password:
```
$ sudo passwd bittube
```

**On FreeBSD**

```
$ sudo pw useradd -n bittube -d /var/www/bittube -s /usr/local/bin/bash -m
$ sudo passwd bittube
```
or use `adduser` to create it interactively.

### Database

Create the production database and a bittube user inside PostgreSQL:

```
$ sudo -u postgres createuser -P bittube
$ sudo -u postgres createdb -O bittube bittube_prod
```

Then enable extensions bittube needs:

```
$ sudo -u postgres psql -c "CREATE EXTENSION pg_trgm;" bittube_prod
$ sudo -u postgres psql -c "CREATE EXTENSION unaccent;" bittube_prod
```

### Prepare BitTubeVid directory

Fetch the latest tagged version of BitTubeVid
```
$ VERSION=$(curl -s https://api.github.com/repos/ipbc-dev/BitTubeVid/releases/latest | grep tag_name | cut -d '"' -f 4) && echo "Latest BitTubeVid version is $VERSION"
```

Open the bittube directory, create a few required directories
```
$ cd /var/www/bittube && sudo -u bittube mkdir config storage versions && cd versions
```

Download the latest version of the BitTubeVid client, unzip it and remove the zip
```
$ sudo -u bittube wget -q "https://github.com/ipbc-dev/BitTubeVid/releases/download/${VERSION}/bittubevid-${VERSION}.zip"
$ sudo -u bittube unzip bittubevid-${VERSION}.zip && sudo -u bittube rm bittubevid-${VERSION}.zip
```

Install BitTubeVid:
```
$ cd ../ && sudo -u bittube ln -s versions/bittubevid-${VERSION} ./bittube-latest
$ cd ./bittube-latest && sudo -H -u bittube yarn install --production --pure-lockfile
```

### BitTubeVid configuration

Copy example configuration:

```
$ cd /var/www/bittube && sudo -u bittube cp bittube-latest/config/production.yaml.example config/production.yaml
```

Then edit the `config/production.yaml` file according to your webserver
configuration.

**BitTubeVid does not support webserver host change**. Keep in mind your domain name is definitive after your first BitTubeVid start.

### Webserver

We only provide official configuration files for Nginx.

Copy the nginx configuration template:

```
$ sudo cp /var/www/bittube/bittube-latest/support/nginx/bittube /etc/nginx/sites-available/bittube
```

Then set the domain for the webserver configuration file. 
Replace `[bittube-domain]` with the domain for the bittube server. 

```
$ sudo sed -i 's/bittube.example.com/[bittube-domain]/g' /etc/nginx/sites-available/bittube
```

Then modify the webserver configuration file. Please pay attention to the `alias` keys of the static locations.
It should correspond to the paths of your storage directories (set in the configuration file inside the `storage` key).

```
$ sudo vim /etc/nginx/sites-available/bittube
```

Activate the configuration file:

```
$ sudo ln -s /etc/nginx/sites-available/bittube /etc/nginx/sites-enabled/bittube
```

To generate the certificate for your domain as required to make https work you can use [Let's Encrypt](https://letsencrypt.org/):

```
$ sudo systemctl stop nginx
$ sudo vim /etc/nginx/sites-available/bittube # Comment ssl_certificate and ssl_certificate_key lines
$ sudo certbot --authenticator standalone --installer nginx --post-hook "systemctl start nginx"
$ sudo vim /etc/nginx/sites-available/bittube # Uncomment ssl_certificate and ssl_certificate_key lines
$ sudo systemctl reload nginx
```

Remember your certificate will expire in 90 days, and thus needs renewal.

Now you have the certificates you can reload nginx:

```
$ sudo systemctl reload nginx
```

**FreeBSD**
On FreeBSD you can use [Dehydrated](https://dehydrated.io/) `security/dehydrated` for [Let's Encrypt](https://letsencrypt.org/)

```
$ sudo pkg install dehydrated
```

### TCP/IP Tuning

**On Linux**

```
$ sudo cp /var/www/bittube/bittube-latest/support/sysctl.d/30-bittube-tcp.conf /etc/sysctl.d/
$ sudo sysctl -p /etc/sysctl.d/30-bittube-tcp.conf
```

Your distro may enable this by default, but at least Debian 9 does not, and the default FIFO
scheduler is quite prone to "Buffer Bloat" and extreme latency when dealing with slower client
links as we often encounter in a video server.

### systemd

If your OS uses systemd, copy the configuration template:

```
$ sudo cp /var/www/bittube/bittube-latest/support/systemd/bittube.service /etc/systemd/system/
```

Update the service file:

```
$ sudo vim /etc/systemd/system/bittube.service
```


Tell systemd to reload its config:

```
$ sudo systemctl daemon-reload
```

If you want to start BitTubeVid on boot:

```
$ sudo systemctl enable bittube
```

Run:

```
$ sudo systemctl start bittube
$ sudo journalctl -feu bittube
```

**FreeBSD**
On FreeBSD, copy the startup script and update rc.conf:

```
$ sudo install -m 0555 /var/www/bittube/bittube-latest/support/freebsd/bittube /usr/local/etc/rc.d/
$ sudo sysrc bittube_enable="YES"
```

Run:

```
$ sudo service bittube start
```

### OpenRC

If your OS uses OpenRC, copy the service script:

```
$ sudo cp /var/www/bittube/bittube-latest/support/init.d/bittube /etc/init.d/
```

If you want to start BitTubeVid on boot:

```
$ sudo rc-update add bittube default
```

Run and print last logs:

```
$ sudo /etc/init.d/bittube start
$ tail -f /var/log/bittube/bittube.log
```

### Administrator

The administrator password is automatically generated and can be found in the
logs. You can set another password with:

```
$ cd /var/www/bittube/bittube-latest && NODE_CONFIG_DIR=/var/www/bittube/config NODE_ENV=production npm run reset-password -- -u root
```

Alternatively you can set the environment variable `PT_INITIAL_ROOT_PASSWORD`,
to your own administrator password, although it must be 6 characters or more.

### What now?

Now your instance is up you can:
 
 * Subscribe to the mailing list for bittube administrators: https://framalistes.org/sympa/subscribe/bittube-admin
 * Add you instance to the public bittube instances index if you want to: https://instances.peertu.be/
 * Check [available CLI tools](/support/doc/tools.md)

## Upgrade

### BitTubeVid instance

**Check the changelog (in particular BREAKING CHANGES!):** https://github.com/ipbc-dev/BitTubeVid/blob/develop/CHANGELOG.md

#### Auto (minor versions only)

The password it asks is BitTubeVid's database user password.

```
$ cd /var/www/bittube/bittube-latest/scripts && sudo -H -u bittube ./upgrade.sh
```

#### Manually

Make a SQL backup

```
$ SQL_BACKUP_PATH="backup/sql-bittube_prod-$(date -Im).bak" && \
    cd /var/www/bittube && sudo -u bittube mkdir -p backup && \
    sudo -u postgres pg_dump -F c bittube_prod | sudo -u bittube tee "$SQL_BACKUP_PATH" >/dev/null
```

Fetch the latest tagged version of BitTubeVid:

```
$ VERSION=$(curl -s https://api.github.com/repos/ipbc-dev/BitTubeVid/releases/latest | grep tag_name | cut -d '"' -f 4) && echo "Latest BitTubeVid version is $VERSION"
```

Download the new version and unzip it:

```
$ cd /var/www/bittube/versions && \
    sudo -u bittube wget -q "https://github.com/ipbc-dev/BitTubeVid/releases/download/${VERSION}/bittubevid-${VERSION}.zip" && \
    sudo -u bittube unzip -o bittubevid-${VERSION}.zip && \
    sudo -u bittube rm bittubevid-${VERSION}.zip
```

Install node dependencies:

```
$ cd /var/www/bittube/versions/bittubevid-${VERSION} && \
    sudo -H -u bittube yarn install --production --pure-lockfile
```

Copy new configuration defaults values and update your configuration file:

```
$ sudo -u bittube cp /var/www/bittube/versions/bittubevid-${VERSION}/config/default.yaml /var/www/bittube/config/default.yaml
$ diff /var/www/bittube/versions/bittubevid-${VERSION}/config/production.yaml.example /var/www/bittube/config/production.yaml
```

Change the link to point to the latest version:

```
$ cd /var/www/bittube && \
    sudo unlink ./bittube-latest && \
    sudo -u bittube ln -s versions/bittubevid-${VERSION} ./bittube-latest
```

### nginx

Check changes in nginx configuration:

```
$ cd /var/www/bittube/versions
$ diff "$(ls --sort=t | head -2 | tail -1)/support/nginx/bittube" "$(ls --sort=t | head -1)/support/nginx/bittube"
```

### systemd

Check changes in systemd configuration:

```
$ cd /var/www/bittube/versions
$ diff "$(ls --sort=t | head -2 | tail -1)/support/systemd/bittube.service" "$(ls --sort=t | head -1)/support/systemd/bittube.service"
```

### Restart BitTube

If you changed your nginx configuration:

```
$ sudo systemctl reload nginx
```

If you changed your systemd configuration:

```
$ sudo systemctl daemon-reload
```

Restart BitTubeVid and check the logs:

```
$ sudo systemctl restart bittube && sudo journalctl -fu bittube
```

### Things went wrong?

Change `bittube-latest` destination to the previous version and restore your SQL backup:

```
$ OLD_VERSION="v0.42.42" && SQL_BACKUP_PATH="backup/sql-bittube_prod-2018-01-19T10:18+01:00.bak" && \
    cd /var/www/bittube && sudo -u bittube unlink ./bittube-latest && \
    sudo -u bittube ln -s "versions/bittubevid-$OLD_VERSION" bittube-latest && \
    sudo -u postgres pg_restore -c -C -d postgres "$SQL_BACKUP_PATH" && \
    sudo systemctl restart bittube
```
