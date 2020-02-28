# Docker guide

You can quickly get a server running using Docker. You need to have
[docker](https://www.docker.com/community-edition) and
[docker-compose](https://docs.docker.com/compose/install/) installed.

## Production

### Install

**BitTubeVid does not support webserver host change**. Keep in mind your domain name is definitive after your first BitTubeVid start.

BitTubeVid needs a PostgreSQL and a Redis instance to work correctly. If you want
to quickly set up a full environment, either for trying the service or in
production, you can use a `docker-compose` setup.

```shell
$ cd /your/bittube/directory
$ mkdir ./docker-volume && mkdir ./docker-volume/traefik
$ curl "https://raw.githubusercontent.com/ipbc-dev/BitTubeVid/master/support/docker/production/config/traefik.toml" > ./docker-volume/traefik/traefik.toml
$ touch ./docker-volume/traefik/acme.json && chmod 600 ./docker-volume/traefik/acme.json
$ curl -s "https://raw.githubusercontent.com/ipbc-dev/BitTubeVid/master/support/docker/production/docker-compose.yml" -o docker-compose.yml "https://raw.githubusercontent.com/ipbc-dev/BitTube/master/support/docker/production/.env" -o .env
```
View the source of the files you're about to download: [docker-compose.yml](https://github.com/ipbc-dev/BitTubeVid/blob/develop/support/docker/production/docker-compose.yml) and the [traefik.toml](https://github.com/ipbc-dev/BitTubeVid/blob/develop/support/docker/production/config/traefik.toml) and the [.env]
(https://github.com/ipbc-dev/BitTubeVid/blob/develop/support/docker/production/.env)

Update the reverse proxy configuration:

```shell
$ vim ./docker-volume/traefik/traefik.toml
```

Tweak the `docker-compose.yml` file there according to your needs:

```shell
$ vim ./docker-compose.yml
```

Then tweak the `.env` file to change the environment variables:

```shell
$ vim ./.env
```
If you did not download the .env file above, here you can look at the variables that can be set:
https://github.com/ipbc-dev/BitTubeVid/blob/develop/support/docker/production/.env

Other environment variables are used in
`support/docker/production/config/custom-environment-variables.yaml` and can be
intuited from usage.

You can use the regular `up` command to set it up:

```shell
$ docker-compose up
```
### Obtaining Your Automatically Generated Admin Credentials
Now that you've installed your BitTubeVid instance you'll want to grep your bittube container's logs for the `root` password.
You're going to want to run `docker-compose logs bittube | grep -A1 root` to search the log output for your new BitTubeVid's instance admin credentials which will look something like this.
```BASH
user@s:~/bittube|master⚡ ⇒  docker-compose logs bittube | grep -A1 root

bittube_1  | [example.com:443] 2019-11-16 04:26:06.082 info: Username: root
bittube_1  | [example.com:443] 2019-11-16 04:26:06.083 info: User password: abcdefghijklmnop
```

### What now?

See the production guide ["What now" section](/support/doc/production.md#what-now). 

### Upgrade

**Important:** Before upgrading, check you have all the `storage` fields in your [production.yaml file](/support/docker/production/config/production.yaml). 

Pull the latest images and rerun BitTubeVid:

```shell
$ cd /your/bittube/directory
$ docker-compose pull
$ docker-compose up -d
```

## Build your own Docker image

```shell
$ git clone https://github.com/ipbc-dev/BitTubeVid /tmp/bittube
$ cd /tmp/bittube
$ docker build . -f ./support/docker/production/Dockerfile.buster
```

## Development

We don't have a Docker image for development. See [the CONTRIBUTING guide](https://github.com/ipbc-dev/BitTubeVid/blob/develop/.github/CONTRIBUTING.md#develop)
for more information on how you can hack BitTubeVid!
