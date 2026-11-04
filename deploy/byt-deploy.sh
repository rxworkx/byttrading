#!/usr/bin/env bash
# The server's deploy script, run by GitHub Actions through an SSH key that can
# run nothing else. Installed to /usr/local/sbin/byt-deploy by install-deploy.sh,
# so changing this file has no effect until the installer is run again.
#
# Reads the built frontend as a .tgz on stdin. The backend is built here. The
# live app and site aren't touched until the new build has succeeded.
set -euo pipefail

CONF=/etc/byttrading-deploy.conf
# shellcheck disable=SC1090
. "$CONF"

command_line="${SSH_ORIGINAL_COMMAND:-}"
if [[ ! "$command_line" =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  echo "Only 'deploy <commit>' is allowed." >&2
  exit 64
fi
sha="${BASH_REMATCH[1]}"

exec 9>"$LOCK_FILE"
flock -w 600 9

cd "$APP_DIR"
state="$APP_DIR/.git/byt-deploy"
mkdir -p "$state"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

old_head=$(git rev-parse HEAD)
backend_swapped=false
code_changed=false
lock_changed=false

# pm2 and health output stay out of the log: the workflow's logs are public.
restart_backend() {
  pm2 restart "$PM2_NAME" >/dev/null
}

backend_healthy() {
  local port
  port=$(sed -nE 's/^PORT="?([0-9]+)"?.*/\1/p' backend/.env | head -1)
  for _ in $(seq 1 "$HEALTH_TRIES"); do
    if curl -fsS -m 5 -o /dev/null "http://127.0.0.1:${port:-4000}/api/health"; then
      return 0
    fi
    sleep "$HEALTH_WAIT"
  done
  return 1
}

# Runs on any failure once the code has changed: puts the previous version back.
rollback() {
  echo "Deploy failed, restoring the previous version." >&2
  trap - ERR
  set +e
  git reset -q --hard "$old_head"
  if [ "$lock_changed" = true ]; then
    npm ci --workspace=backend --include=dev --no-audit --no-fund >/dev/null 2>&1 ||
      echo "Could not restore packages. Check the server." >&2
  fi
  if [ "$backend_swapped" = true ] && [ -d "$state/dist.prev" ]; then
    rm -rf backend/dist
    mv "$state/dist.prev" backend/dist
    restart_backend
    if backend_healthy; then
      echo "Previous version restored and healthy." >&2
    else
      echo "Previous version is NOT healthy. Check the server." >&2
    fi
  fi
  exit 1
}

# Check the upload before changing anything.
head -c 524288000 > "$work/frontend.tgz"
mkdir "$work/out"
tar --no-same-owner --no-same-permissions -xzf "$work/frontend.tgz" -C "$work/out"
for page in index.html 404.html; do
  [ -f "$work/out/$page" ] || { echo "The upload has no $page." >&2; exit 65; }
done

echo "Fetching $sha"
git fetch -q --depth=1 origin "$sha"
trap rollback ERR
git reset -q --hard FETCH_HEAD

backend_tree=$(git rev-parse HEAD:backend)
lock_hash=$(sha256sum package-lock.json | cut -d' ' -f1)
[ "$backend_tree" = "$(cat "$state/backend-tree" 2>/dev/null)" ] || code_changed=true
[ "$lock_hash" = "$(cat "$state/lock-hash" 2>/dev/null)" ] || lock_changed=true

if [ "$lock_changed" = true ]; then
  echo "Installing packages"
  npm ci --workspace=backend --include=dev --no-audit --no-fund
fi

if [ "$code_changed" = true ] || [ "$lock_changed" = true ]; then
  # Built outside backend/dist, because `nest build` empties that folder first
  # and the running app still needs it.
  echo "Building backend"
  rm -rf "$state/dist.new"
  (cd backend && npx tsc -p tsconfig.build.json --rootDir src --incremental false --outDir "$state/dist.new")
  [ -f "$state/dist.new/main.js" ]

  if grep -qE '^DATABASE_DRIVER="?sqlite' backend/.env; then
    echo "Backing up the database"
    (cd backend && node dist/database/backup.js >/dev/null)
  fi

  rm -rf "$state/dist.prev"
  mv backend/dist "$state/dist.prev"
  backend_swapped=true
  mv "$state/dist.new" backend/dist

  echo "Restarting $PM2_NAME"
  restart_backend
  backend_healthy
else
  echo "Backend unchanged, not restarting."
fi

# Old hashed assets stay for a while, for pages already open in a browser.
echo "Updating the site files"
rsync -rlt --checksum --chmod=D755,F644 --delete-delay \
  --filter='P /.well-known/***' --filter='P /_next/static/***' \
  "$work/out/" "$WEB_ROOT/"
find "$WEB_ROOT/_next/static" -type f -mtime +30 -delete

trap - ERR
printf '%s' "$backend_tree" > "$state/backend-tree"
printf '%s' "$lock_hash" > "$state/lock-hash"
echo "Deployed $sha"
