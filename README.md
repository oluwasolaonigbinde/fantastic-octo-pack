# Baiy Web

## API URL

In `.env.local`, set `NEXT_PUBLIC_API_URL` to the **single base URL** the backend team gives you. It must end with `/api/v1` (e.g. `http://localhost:4000/api/v1`). See `.env.local.example`.

With `npm run dev`, the app is served at `http://localhost:3000`. The API allows that origin in development (CORS), so the browser can call the backend when both run locally.

`NEXT_API_URL` is a legacy alias and is outside the supported Slice 1 browser-app contract.

## Deterministic local runner

Use the runner-owned workflow for Playwright checks. It starts only the services the chosen mode needs, refuses to reuse unknown listeners on the required ports, refreshes auth state when requested, and tears down only the processes it started.

Primary commands:

```bash
npm run test:e2e:local:frontend:smoke
npm run test:e2e:local:frontend:core
npm run test:e2e:local:frontend:slice:01
npm run test:e2e:local:live:slice:02
npm run test:e2e:local:cleanup
```

- `frontend-only` mode builds and starts the frontend only.
- `live` mode builds and starts backend + frontend, seeds local role auth users, refreshes Playwright auth storage state, and then runs the requested Playwright target.
- The runner owns an isolated automation frontend by default: `http://127.0.0.1:3100`, so Playwright does not share Docker/dev port `3000`. The backend default remains `http://localhost:4000`.
- The runner warms `/`, `/login`, and the main dashboard shells before auth refresh or browser specs. Override with `PLAYWRIGHT_FRONTEND_WARM_PATHS` or skip with `PLAYWRIGHT_SKIP_FRONTEND_WARMUP=1`.
- If another process already owns one of those ports, the runner fails fast instead of guessing which server to reuse.

## Manual startup

Manual startup is still useful for debugging, but it is no longer the recommended default path for Playwright verification.

1. Start the backend from `../buiy-backend/baiy-server` (or use the URL they gave you).
2. In `.env.local`, set `NEXT_PUBLIC_API_URL` to that URL.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

## Supported auth path

- Manual signup: `/register` -> `/verify-email` -> `/select-role` -> `/create-password` -> `/login`
- Google-assisted signup: `/register` -> `/select-role` -> `/create-password` -> `/login`
- Password reset: `/forgot-password` -> `/verify-otp` -> `/reset-password` -> `/login`
- `/register` posts to `{NEXT_PUBLIC_API_URL}/auth/register`
- `/verify-email` posts to `{NEXT_PUBLIC_API_URL}/auth/verify-email`
- `/select-role` persists role selection through `{NEXT_PUBLIC_API_URL}/auth/register`
- `/create-password` posts to `{NEXT_PUBLIC_API_URL}/auth/create-account`
- `/login` posts to `{NEXT_PUBLIC_API_URL}/auth/login`
- `/forgot-password` posts to `{NEXT_PUBLIC_API_URL}/auth/forgot-password`
- `/verify-otp` posts to `{NEXT_PUBLIC_API_URL}/auth/verify-otp`
- `/reset-password` posts to `{NEXT_PUBLIC_API_URL}/auth/reset-password`

Behavioral contract:

- `/register` is the shared public entry surface for manual and Google-assisted signup.
- Only `/login` creates an authenticated session.
- Signup and reset OTPs are 6 digits and expire after 15 minutes.
- `/auth/register` may return `status=account_exists` with `nextStep=login`.
- `/auth/login` may return `status=onboarding_incomplete` with the next public auth step.
- Google is signup assistance only. Final accounts remain local email/password accounts.
- Google prefill covers first name, last name, and email only.
- Frontend may collect a `googleIdToken`, but backend decides whether the request qualifies as Google-assisted.
- Before a request may be treated as Google-assisted, backend must verify `googleIdToken` server-side, confirm the token audience exactly matches `GOOGLE_CLIENT_ID`, and confirm the verified Google email exactly matches the submitted email.
- If the submitted email diverges from the verified Google email, frontend must clear Google-assisted state and the request must continue on the manual signup path. Editing first or last name alone does not clear Google-assisted state.
- Invalid Google token or invalid audience is a Google credential validation failure, not a manual-signup fallback.
- No Google login, no automatic session creation, and no account linking are part of the supported public auth contract.

The supported self-registration roles in Slice 1 are:

- `buyer`
- `distributor`
- `oem`
- `engineer`

## Legacy and unsupported paths

- `contexts/auth-context.tsx` and `components/dashboard/dashboard-router.tsx` are retained only as isolated brownfield artifacts. `app/providers.tsx` no longer mounts the legacy auth context globally.
- `/kyc-onboarding` is the canonical non-auth onboarding route for the later KYC/profile flow.
- `/onboarding` is retained only as a brownfield compatibility alias until downstream deep links are cleaned up.
- Login OTP, password-reset email links, and Google login are not part of the supported public auth contract.

## Verification commands

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e:smoke
npm run test:e2e:core
npm run test:e2e:slice:01
npm run test:e2e:slice:02
npm run test:e2e:local:frontend:smoke
npm run test:e2e:local:frontend:core
npm run test:e2e:local:frontend:slice:01
npm run test:e2e:local:live:slice:02
```

Verification expectations for later implementation closeout:

- Google button renders on `/register`.
- Google prefill sets first name, last name, and email.
- Backend verifies the token server-side before treating the flow as Google-assisted.
- Backend rejects Google-assisted classification when the token audience does not match `GOOGLE_CLIENT_ID`.
- Backend rejects Google-assisted classification when the verified Google email does not exactly match the submitted email and the flow resumes the manual OTP path instead.
- Submit after valid Google prefill skips `/verify-email` and continues to `/select-role`.
- Manual signup remains unchanged.
- Existing `/verify-email`, `/select-role`, `/create-password`, and `/login` flows remain intact.
- Duplicate-account and single-pending-registration behavior remain unchanged.

## Local Playwright auth helper

`npm run test:e2e:auth:refresh` is a local-only helper for deterministic role storage states. It uses `PLAYWRIGHT_BASE_URL` for the storage-state origin and defaults to `http://127.0.0.1:3100`. It uses `PLAYWRIGHT_API_URL` first, then `NEXT_PUBLIC_API_URL`, then falls back to `http://127.0.0.1:4000/api/v1`. By default it reads automation credentials from `../../scripts/local-role-auth.playwright.accounts.json`, while the backend `npm run seed:local-role-auth` command seeds the separate manual QA users from `../../scripts/local-role-auth.manual.accounts.json`. The runner-owned `live` workflow calls this helper automatically against the frontend origin it just started and enables the localhost-only auth bridge for built frontend runs through `NEXT_PUBLIC_ENABLE_LOCAL_ROLE_AUTH=1`.

Use `npm run test:e2e:auth:clear` to remove the saved role auth-state files under `playwright/.auth`.

Additional frontend env vars:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` enables Google-assisted signup prefill on `/register`.
- `npm run test:google-env` verifies that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is present and, when a backend env is available locally or in process, matches `GOOGLE_CLIENT_ID`.
- In production builds, `/register` now disables the Google button and shows an explicit deployment warning when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is missing.

Related backend env contract:

- `GOOGLE_CLIENT_ID` is required for backend audience verification in the supported Google-assisted signup flow.
- `GOOGLE_CLIENT_SECRET` may exist for backend env parity, but it does not expand this contract into OAuth authorization-code flow or Google login.
