# Automatic deploys

Every push to `main` builds the backend and frontend on GitHub. If both build, the workflow updates the server, restarts `byttrading-api` if the backend changed, and checks the site. Other apps on the server are not touched.

If the new backend fails its health check, the server goes back to the previous version and the workflow run shows as failed. `.env` and the database are not in Git, so a deploy never changes them.

## Setup

Do this once, after this folder has been pushed. Pushes only build until step 5.

1. On your own computer, create a key used only for deploys, with no passphrase:

   ```bash
   ssh-keygen -t ed25519 -N '' -C byttrading-deploy -f ~/.ssh/byt-deploy
   cat ~/.ssh/byt-deploy.pub
   ```

2. On the server, as root, install the deploy script. This doesn't change the running app:

   ```bash
   cd /var/www/byttrading
   git fetch --depth=1 origin main
   mkdir -p /root/byt-setup
   git archive FETCH_HEAD deploy | tar -x -C /root/byt-setup
   bash /root/byt-setup/deploy/install-deploy.sh "PASTE THE .pub LINE HERE"
   ```

3. Add swap if the server has none. The backend build runs on the server, and other apps share its memory:

   ```bash
   fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

4. In the GitHub repo, go to Settings, Secrets and variables, Actions, and add these repository secrets:

   | Secret | Value |
   | --- | --- |
   | `VPS_HOST` | The server's IP address |
   | `VPS_SSH_KEY` | The whole of `~/.ssh/byt-deploy`, the file without `.pub` |
   | `VPS_KNOWN_HOSTS` | The output of `ssh-keyscan -t ed25519 <server IP>` |

   Check the `ssh-keyscan` fingerprint with `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the server.

5. On the same page, add a repository variable named `DEPLOY_ENABLED` with the value `true`.

6. Open the Actions tab, select the latest Deploy run, and re-run it. Check the site afterwards. The first run reinstalls packages and restarts the backend, which takes a few minutes.

## Everyday use

- **To deploy:** push to `main`. Keep unfinished work on another branch, because every push to `main` goes live.
- **To undo a bad deploy:** revert the commit and push. If the bad version changed the database, restore a backup too.
- **To pause deploys:** set `DEPLOY_ENABLED` to `false`. Do this before any manual server work, including the SQLite move.
- **After changing `byt-deploy.sh`:** repeat step 2. The server keeps its own copy, so a push alone doesn't change it.

## Good to know

- Workflow logs are public because the repo is public. Never print settings or secrets from a step.
- On Postgres, new migrations do not run automatically. Run them by hand with `npm run migration:run --workspace=backend`. On SQLite they run when the backend starts, and the deploy backs up the database first.
- pm2 runs as root here, so everything pushed to `main` runs as root on a server shared with other apps. Moving the app to its own user would limit the damage from a bad package or a security hole.
