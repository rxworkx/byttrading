#!/usr/bin/env bash
# One time server setup for automatic deploys, run as root:
#   bash install-deploy.sh "<contents of the deploy key's .pub file>"
# Safe to run again, which is also how to update the server's deploy script.
set -euo pipefail

APP_DIR=/var/www/byttrading
WEB_ROOT=/home/user/web/byttrading.com/public_html
PM2_NAME=byttrading-api
PUBLIC_KEY="${1:-}"
HERE=$(cd "$(dirname "$0")" && pwd)

fail() { echo "ERROR: $1" >&2; exit 1; }

[ "$(id -u)" = 0 ] || fail "run this as root."
[[ "$PUBLIC_KEY" =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+(\ .*)?$ ]] || fail "pass the public key (ssh-ed25519 ...)."
[ -d "$APP_DIR/.git" ] || fail "$APP_DIR is not a git checkout."
[ -d "$WEB_ROOT" ] || fail "$WEB_ROOT does not exist."
for tool in git node npm npx pm2 curl rsync flock sha256sum; do
  command -v "$tool" >/dev/null || fail "$tool is not installed."
done
pm2 describe "$PM2_NAME" >/dev/null 2>&1 || fail "pm2 has no process named $PM2_NAME."

login=$(sshd -T 2>/dev/null | awk '$1 == "permitrootlogin" { print $2 }')
case "$login" in
  no) fail "sshd has PermitRootLogin no, so the deploy key could not log in." ;;
  '') echo "WARNING: could not read PermitRootLogin from sshd." >&2 ;;
esac

# SSH commands run without a login shell, so record where node and pm2 are now.
tool_path="$(dirname "$(command -v node)"):$(dirname "$(command -v pm2)"):/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
cat > /etc/byttrading-deploy.conf <<CONF
APP_DIR=$APP_DIR
WEB_ROOT=$WEB_ROOT
PM2_NAME=$PM2_NAME
LOCK_FILE=/run/byt-deploy.lock
HEALTH_TRIES=30
HEALTH_WAIT=2
export HOME=/root
export PM2_HOME=/root/.pm2
export PATH="$tool_path"
CONF
chmod 600 /etc/byttrading-deploy.conf
install -m 700 -o root -g root "$HERE/byt-deploy.sh" /usr/local/sbin/byt-deploy

entry="restrict,command=\"/usr/local/sbin/byt-deploy\" $PUBLIC_KEY"
mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
grep -qxF "$entry" /root/.ssh/authorized_keys || printf '%s\n' "$entry" >> /root/.ssh/authorized_keys

echo "Deploy script installed. This key can only run /usr/local/sbin/byt-deploy."
