# SKNAI Deep Security Audit — 2026-05-12

## Scope

Reviewed SKNAI application security without changing UI/UX:

- Dependencies
- Secret exposure
- Auth/session handling
- Demo account exposure
- API authorization and CSRF/origin behavior
- Browser security headers / CSP
- Vercel deployment posture
- Risky frontend patterns
- Database/backend production readiness

## Changes applied

### Critical / High fixes

1. **Disabled demo accounts in production by default**
   - Demo logins now require `ENABLE_DEMO_ACCOUNTS=true` and are disabled when `NODE_ENV=production` or `VERCEL` is present.
   - Production override requires explicit `SKNAI_ALLOW_DEMO_IN_PRODUCTION=true` and should not be used for real launch.
   - Demo session cookie is now `HttpOnly`, `SameSite=Lax`, `Priority=Low`, and `Secure` in production.

2. **Added `.gitignore`**
   - Excludes `env.json`, `.env*`, `node_modules`, `dist`, logs, and security-audit artifacts.
   - Prevents local secrets from being committed.

3. **Added Vercel static security headers**
   - `vercel.json` now applies CSP and hardening headers to static frontend routes too, not only Hono/API responses.

### Dependency fixes

4. **Removed vulnerable indirect dependency path**
   - Removed `vite-plugin-node-polyfills`, which pulled vulnerable `elliptic` through `crypto-browserify`.
   - `pnpm audit --audit-level low` now reports no known vulnerabilities.

5. **Previously upgraded vulnerable packages**
   - `jspdf` upgraded to `4.2.1`.
   - `kysely` upgraded to `0.28.17`.

### Auth/session hardening already present/confirmed

6. **Session cookies hardened**
   - Uses `sknai_session`.
   - Requires strong `JWT_SECRET` length.
   - Cookies use `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age`, `Priority=High`, and `Secure` in production.

7. **Admin APIs checked for role guards**
   - Admin endpoints use server-side `getServerUserSession` and role checks for `admin` / `superadmin`.
   - Unauthenticated `/_api/admin/stats` test returns `401`.

### API / request hardening already present/confirmed

8. **Global request protection**
   - 2MB request-size guard.
   - Cross-origin mutating requests blocked by Origin/Host check.
   - Tested malicious cross-origin POST returned `403`.

9. **Input validation**
   - Endpoint schemas use Zod/superjson parsing.
   - Kysely parameterized SQL used; reviewed raw `sql` template usages and found parameterized interpolation, not string concatenation.

### Browser security hardening

10. **Security headers**
    - CSP
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy`
    - COOP/CORP
    - HSTS in production

11. **XSS pattern review**
    - `dangerouslySetInnerHTML` exists only in chart CSS injection path and was sanitized.
    - `target="_blank"` links reviewed; important external links include `rel="noopener noreferrer"`.
    - OAuth popup message listener verifies `event.origin === window.location.origin`.

## Verification performed

Commands/tests run:

```bash
pnpm build
pnpm audit --audit-level low
```

Local smoke/security checks:

- `/` → 200
- `/login` → 200
- `/admin/dashboard` → 200 SPA route
- `/_api/manifest` → 200
- Unauthenticated `/_api/admin/stats` → 401
- Cross-origin POST to login endpoint → 403
- Demo admin login in local demo mode → 200
- Authenticated `/_api/admin/stats` after demo login → 200
- CSP header present on local response

## Remaining risks / launch checklist

These are not blockers for demo/local work, but should be addressed before production launch:

1. **Do not deploy demo accounts**
   - Ensure Vercel does NOT set `ENABLE_DEMO_ACCOUNTS=true` or `SKNAI_ALLOW_DEMO_IN_PRODUCTION=true`.

2. **Move localStorage demo workflows to server DB**
   - The newer fractional/tokenization/secondary-market demo flows save some workflow state in browser `localStorage`.
   - For production, persist these in Postgres tables with server-side authorization and immutable audit logs.

3. **Add production-grade rate limiting**
   - Login has DB-backed failed-attempt controls.
   - Add edge/provider rate limiting for all auth, admin mutation, file upload, and payment endpoints.

4. **Add MFA for admins/superadmins**
   - Strongly recommended before launch.

5. **File-upload security**
   - Current document upload fields are demo filename captures in the new local flows.
   - Real uploads need malware scanning, file size/type allowlists, private object storage, signed URLs, and admin-only access.

6. **Database hardening**
   - Use managed Postgres with TLS required.
   - Use least-privilege DB user.
   - Enable backups/PITR.
   - Consider row-level security or strict service-layer ownership checks.

7. **Regulated workflow controls**
   - Before real fractional ownership/tokenization/secondary-market use, add legal/compliance review, immutable approval records, and REGA/FAL document verification integrations where possible.

## Current status

Security posture improved. Build and audit pass. Suitable for local demo/testing and ready for a safer Vercel deployment path once production env vars and Postgres are configured.
