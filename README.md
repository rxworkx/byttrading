# BYT Trading

A trading platform where users deposit funds, subscribe to one of three algorithmic trading bots (AetherGuard, QuantumPulse, TitanForge), and run fixed-cycle trades with locked principal/profit that release automatically on completion.

## Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), Tailwind CSS v4, shadcn/ui (Base UI), Recharts
- **Backend**: NestJS 11, TypeORM, PostgreSQL (Supabase)
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
