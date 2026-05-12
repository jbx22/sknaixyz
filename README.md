# SKNAI

SKNAI is the current SKN real-estate PWA with REGA-aware subscription approval, fractional ownership, tokenization, secondary market, admin, and super-admin flows.

## Demo Access

Use the quick demo buttons on `/login`, or sign in manually with password `demo123`:

- Investor / Buyer: `demo.investor@sknai.test`
- Property Owner: `demo.owner@sknai.test`
- Real Estate Office / Broker: `demo.broker@sknai.test`
- Developer: `demo.developer@sknai.test`
- Admin: `demo.admin@sknai.test`
- Super Admin: `demo.superadmin@sknai.test`

Demo regulated users are pre-approved locally after login so fractional ownership, tokenization, property publishing, and secondary-market gates can be tested. Public/free users can still view listings.

## Security

A deep security audit report is saved at `SECURITY_AUDIT.md`.

Important production rule: do **not** enable demo accounts in Vercel. Leave `ENABLE_DEMO_ACCOUNTS` unset/false and do not set `SKNAI_ALLOW_DEMO_IN_PRODUCTION=true`.

## Backend / Database

Supabase is **not required**.

The backend uses:

- Hono server/API routes
- Kysely query builder
- PostgreSQL via the `postgres` driver

For Vercel, use Vercel Postgres, Neon, Railway Postgres, Render Postgres, or any managed PostgreSQL database.

Required environment variables:

```bash
JWT_SECRET=replace-with-random-32-byte-hex
DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require
# or POSTGRES_URL=...
```

Run the schema once before production deployment:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

`helpers/db.tsx` checks `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, then legacy `FLOOT_DATABASE_URL` for compatibility.

## Vercel deployment

Included files:

- `vercel.json`
- `api/[...path].ts`
- `.env.example`
- `database/schema.sql`

Deploy steps:

1. Push/upload this folder to GitHub.
2. Import the project in Vercel.
3. Add env vars from `.env.example`.
4. Run `database/schema.sql` against your Postgres database.
5. Deploy.

Build command:

```bash
pnpm build
```

Output directory:

```bash
dist
```

Local development:

```bash
pnpm install
pnpm build
PORT=3336 pnpm start
```

On Windows PowerShell:

```powershell
pnpm install
pnpm build
$env:PORT='3336'; pnpm start
```
