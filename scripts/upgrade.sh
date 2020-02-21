#!/bin/sh

set -eu

BITTUBE_PATH=${1:-/var/www/bittube/}

if [ ! -e "$BITTUBE_PATH" ]; then
  echo "Error - path \"$BITTUBE_PATH\" wasn't found"
  echo ""
  echo "If BittubeVid was installed in another path, you can specify it with"
  echo "    ./upgrade.sh <PATH>"
  exit 1
fi

if [ ! -e "$BITTUBE_PATH/versions" -o ! -e "$BITTUBE_PATH/config/production.yaml" ]; then
  echo "Error - Couldn't find BitTubeVid installation in \"$BITTUBE_PATH\""
  echo ""
  echo "If BitTubeVid was installed in another path, you can specify it with"
  echo "    ./upgrade.sh <PATH>"
  exit 1
fi

if [ -x "$(command -v awk)" ] && [ -x "$(command -v sed)" ] ; then
    REMAINING=$(df -k $BITTUBE_PATH | awk '{ print $4}' | sed -n 2p)
    ONE_GB=$((1024 * 1024))
    if [ "$REMAINING" -lt "$ONE_GB" ]; then
    echo "Error - not enough free space for upgrading"
    echo ""
    echo "Make sure you have at least 1 GB of free space in $BITTUBE_PATH"
    exit 1
    fi
fi

# Backup database
if [ -x "$(command -v pg_dump)" ]
then 
  SQL_BACKUP_PATH="$BITTUBE_PATH/backup/sql-bittube_prod-$(date +"%Y%m%d-%H%M").bak" 
  DB_USER=$(node -e "console.log(require('js-yaml').safeLoad(fs.readFileSync('$BITTUBE_PATH/config/production.yaml', 'utf8'))['database']['username'])")
  DB_PASS=$(node -e "console.log(require('js-yaml').safeLoad(fs.readFileSync('$BITTUBE_PATH/config/production.yaml', 'utf8'))['database']['password'])")
  DB_HOST=$(node -e "console.log(require('js-yaml').safeLoad(fs.readFileSync('$BITTUBE_PATH/config/production.yaml', 'utf8'))['database']['hostname'])")
  DB_SUFFIX=$(node -e "console.log(require('js-yaml').safeLoad(fs.readFileSync('$BITTUBE_PATH/config/production.yaml', 'utf8'))['database']['suffix'])")
  mkdir -p $BITTUBE_PATH/backup
  PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h $DB_HOST -F c "bittube${DB_SUFFIX}" -f "$SQL_BACKUP_PATH"
else
  echo "pg_dump not found. Cannot make a SQL backup!"
fi

# If there is a pre-release, give the user a choice which one to install.
RELEASE_VERSION=$(curl -s https://api.github.com/repos/ipbc-dev/BitTubeVid/releases/latest | grep tag_name | cut -d '"' -f 4)
PRE_RELEASE_VERSION=$(curl -s https://api.github.com/repos/ipbc-dev/BitTubeVid/releases | grep tag_name | head -1 | cut -d '"' -f 4)

if [ "$RELEASE_VERSION" != "$PRE_RELEASE_VERSION" ]; then
  echo -e "Which version do you want to install?\n[1] $RELEASE_VERSION (stable) \n[2] $PRE_RELEASE_VERSION (pre-release)"
  read choice
  case $choice in
      [1]* ) VERSION="$RELEASE_VERSION";;
      [2]* ) VERSION="$PRE_RELEASE_VERSION";;
      * ) exit;
  esac
else
  VERSION="$RELEASE_VERSION"
fi

echo "Installing BitTube version $VERSION"
wget -q "https://github.com/ipbc-dev/BitTubeVid/releases/download/${VERSION}/bittubevid-${VERSION}.zip" -O "$BITTUBE_PATH/versions/bittubevid-${VERSION}.zip"
cd $BITTUBE_PATH/versions
unzip -o "bittubevid-${VERSION}.zip"
rm -f "bittubevid-${VERSION}.zip"

# Upgrade Scripts
rm -rf $BITTUBE_PATH/bittube-latest
ln -s "$BITTUBE_PATH/versions/bittubevid-${VERSION}" $BITTUBE_PATH/bittube-latest
cd $BITTUBE_PATH/bittube-latest
yarn install --production --pure-lockfile 
cp $BITTUBE_PATH/bittube-latest/config/default.yaml $BITTUBE_PATH/config/default.yaml

echo "Differences in configuration files..."
diff -u $BITTUBE_PATH/config/production.yaml "$BITTUBE_PATH/versions/bittube-${VERSION}/config/production.yaml.example"

echo ""
echo "==========================================="
echo "==   Don’t forget to restart BitTube!   =="
echo "==========================================="
