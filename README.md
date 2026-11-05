# BYT Trading

A trading platform where users deposit funds, subscribe to one of three algorithmic trading bots (AetherGuard, QuantumPulse, TitanForge), and run fixed-cycle trades with locked principal/profit that release automatically on completion.

## Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), Tailwind CSS v4, shadcn/ui (Base UI), Recharts
- **Backend**: NestJS 11, TypeORM, SQLite (`better-sqlite3`), or PostgreSQL if `DATABASE_DRIVER` is not set
- **Auth**: Argon2 password hashing, JWT access + rotating opaque refresh tokens (httpOnly cookies), email-based 2FA
- **Prices**: CoinGecko free API, polled and cached server-side

## Repo layout

```
backend/     NestJS API (port 4000)
frontend/    Next.js app (port 3000)
prd/         Original brief and reference assets (prd_prompt.txt is gitignored — contains sensitive notes)
```

## First-time setup

### 1. Rotate the database password

The Supabase database password used during initial development sat in a plaintext file (`prd/prd_prompt.txt`) that passed through AI tooling. **Rotate it now** in Supabase → Project Settings → Database → Reset password, before using this in anything beyond local development.

### 2. Environment variables

Copy the example env files and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Backend `.env` needs at minimum:
- `DATABASE_URL` — Supabase pooler connection string (session mode / port 5432 works best with this setup)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_TTL` etc. — see `.env.example`
- `MAIL_HOST` / `MAIL_PORT` — an SMTP server for verification/OTP emails (use something like Mailhog locally, or a real provider in production)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — creates one admin user when you run the seed script

### 3. Install dependencies

```bash
npm install
```

### 4. Run database migrations and seed data

```bash
cd backend
npm run migration:run
npm run seed
```

The seed script populates the three investment plans (AetherGuard/QuantumPulse/TitanForge), default site settings, and one admin user.

### 5. Run both apps

```bash
# from the repo root
npm run dev
```

This runs the backend on `http://localhost:4000` and frontend on `http://localhost:3000` concurrently. Or run them individually with `npm run dev:backend` / `npm run dev:frontend`.

## Notable design decisions

- **Deposits are admin-confirmed**: there's no blockchain listener. A user submits a deposit claim (`POST /wallets/deposit`), and an admin confirms it via `PATCH /transactions/:id/confirm` before the wallet balance updates.
- **Withdrawals require admin approval by default** (toggle via the `withdrawal_requires_admin_approval` setting).
- **Investment cron** (`InvestmentsService.processInvestments`, every 5 minutes) accrues profit within each plan's published rate range and releases principal + profit back to the trading wallet when a cycle completes.
- **Referral bonuses** are credited automatically the first time a referred user subscribes to a plan.
- **Legal pages** (Terms, Privacy, Risk Disclosure, Regulatory Status, Company Registration) contain boilerplate copy — review with counsel before real launch, especially Regulatory Status, which explicitly does not claim any financial services license.

## Testing changes

There's no automated test suite yet (not part of the original scope). To verify changes manually:

1. Boot both apps (`npm run dev`).
2. Sign up a user, then either check the configured mailbox for the verification link, or (in dev, with no mail server) mark it verified directly in the DB: `UPDATE users SET "isEmailVerified" = true WHERE email = '...'`.
3. Log in — if the mail server isn't wired up, disable 2FA for that user first (`UPDATE users SET "twoFactorEnabled" = false WHERE email = '...'`) to skip the OTP step.
4. Walk the golden path: deposit → admin-confirm → subscribe to a plan → transfer to trading wallet → start a trade → (optionally fast-forward `nextAccrualAt`/`endDate` on the investment row to test the cron) → withdraw.

## Running on SQLite

Set `DATABASE_DRIVER="sqlite"` and `SQLITE_PATH` in `backend/.env`. Without `DATABASE_DRIVER` the backend uses Postgres.

**Host requirements**

- A persistent local disk. Hosts that wipe the disk on deploy will lose all data.
- Exactly one running backend process. The transaction queue works per process, so don't run replicas or cluster mode.
- `SQLITE_PATH` must be absolute in production, or the app refuses to start.
- `MAIL_DISABLED` must not be set in production, or customers get no email.

**Schema changes**

SQLite migrations live in `backend/src/database/migrations-sqlite` and run automatically at startup. After changing an entity:

```
npm run migration:generate --workspace=backend -- src/database/migrations-sqlite/<Name>
```

The `backend/src/database/migrations` folder is Postgres only.

**Backups**

`npm run db:backup --workspace=backend` takes a consistent copy while the app is running. Run it from cron, and copy the backups to another machine. To restore, stop the app, delete the database's `-wal` and `-shm` files, and replace the database file with a backup.

## Deploying with Docker

`docker-compose.yml` runs three containers:

- `web`: Caddy. Serves the frontend, handles HTTPS, and passes `/api` to the backend.
- `backend`: the API, on SQLite in the `app-data` volume. Not reachable from the internet.
- `backup`: copies the database once a day to the `backups` volume.

**Never run `docker compose down -v`.** The `-v` deletes the customer database.

### First setup

1. Install Docker on the server, and confirm nothing else is using ports 80 and 443: `ss -ltn | grep -E ':(80|443) '`. Open both ports in any firewall.
2. Clone the repo, run `cp .env.example .env`, and fill in `.env`.
3. Run `docker compose build`. The frontend build needs about 2 GB of memory, so add swap on a small server.

### Sharing the server

The stack needs nothing else on the server, and by default Caddy holds ports 80 and 443. If another web server already holds them, such as the nginx of a control panel, turn on sharing mode until it is gone.

1. Add these lines to `.env`, then start or restart the stack as usual:

   ```
   COMPOSE_FILE=docker-compose.yml:docker-compose.behind-proxy.yml
   WEB_PORT=8088
   ```

   The stack now listens on `127.0.0.1:8088` only, without HTTPS. Confirm the port is free first: `ss -ltn | grep ':8088 '` should print nothing.

2. In the other web server, give the domain HTTPS, redirect the bare domain to `www`, and forward everything to the stack. For nginx:

   ```nginx
   location / {
       proxy_pass http://127.0.0.1:8088;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       # $remote_addr, so a visitor can't fake their address to dodge rate limits
       proxy_set_header X-Forwarded-For $remote_addr;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

   Sharing mode depends on `X-Forwarded-For` being set this way, because the backend reads the visitor's address from it.

**To stop sharing:** stop the other web server, delete both lines from `.env`, and run `docker compose up -d`. Caddy takes ports 80 and 443 and gets its own certificates. No data moves.

### Moving from Postgres

1. Stop the old backend, so no writes are lost after the export.
2. Export every table in `public` to CSV with `\copy ... with (format csv, header true)`, one `<table>.csv` per table.
3. Copy the folder to the server and make it readable by the container's user: `chown -R 1000:1000 <csv folder>`.
4. Import into the empty database. It checks foreign keys and rolls back on failure:

   ```
   docker compose run --rm --no-deps -v <csv folder>:/import:ro backend node dist/database/import-csv-export.js /import
   ```

5. Point the DNS A records for `SITE_DOMAIN` and `REDIRECT_DOMAIN` at the server, then run `docker compose up -d`. Caddy gets the certificates once DNS has updated. In sharing mode, set up the forwarding instead.
6. Check the site, then delete the CSV folder from the server.
7. Keep the old database untouched until the new setup has run correctly for a while.

### Updating

```
git pull && docker compose build && docker compose up -d
```

Migrations run when the backend starts.

### Backups

Backups sit on the same disk as the database, so they won't survive losing the server. Copy them somewhere else regularly:

```
docker compose cp backup:/backups ./backups
```

To restore, run `docker compose stop backend backup`, then copy a backup over `/data/byttrading.sqlite` in the `app-data` volume, delete the `-wal` and `-shm` files beside it, and start the containers again. The restored file must be owned by user 1000.
