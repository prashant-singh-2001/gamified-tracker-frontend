# Etram — web frontend

The web UI for the [`gamified_tracker`](https://github.com/prashant-singh-2001/gamified_tracker)
backend. Log activities, earn XP, keep streaks alive and climb nine rank tiers from Basecamp to
Summit.

This repo is currently a **routed, authenticated skeleton**: every screen from
[`etram-screens.md`](./etram-screens.md) exists as a lazy route, the API and auth layer works end to
end, and the Landing, Login/Register and Today screens are real. The remaining screens are
placeholders to be built one at a time. See [`FRONTEND_REQUIREMENTS.md`](./FRONTEND_REQUIREMENTS.md)
for the full spec.

## Stack

Vite · React 19 · TypeScript (strict) · React Router (data router) · TanStack Query · Zustand
(auth session only) · Axios · React Hook Form + Zod · Tailwind CSS v4 · Recharts · lucide-react ·
Vitest + Testing Library + MSW · ESLint + Prettier.

## Getting started

Requires Node 22+ (developed on Node 24).

1. **Start the backend** (in the `gamified_tracker` repo):

   ```bash
   docker compose up -d
   ```

   The API gateway listens on `http://localhost:8080`.

2. **Install and run the frontend:**

   ```bash
   npm install
   cp .env.example .env   # optional, see below
   npm run dev            # http://localhost:5173
   ```

### API access in development

By default `VITE_API_BASE_URL` is empty and the Vite dev server **proxies `/api` and `/auth` to
`http://localhost:8080`**, so the browser makes same-origin requests and no CORS setup is needed.
The proxy also strips the `Origin` header: browsers send it on POSTs even same-origin, and the
gateway's closed CORS policy would otherwise answer register/login with a bare
`403 Invalid CORS request` ("You don't have permission to do that.").

To call the gateway directly instead, set `VITE_API_BASE_URL=http://localhost:8080` and add
`CORS_ALLOWED_ORIGINS=http://localhost:5173` to the backend `.env`.

### Getting an admin account

Self-registration always creates a `USER`. Admins are provisioned on the backend through the
`app.admin.bootstrap.*` properties (see the backend's `.env.example` / `application.yaml`), never
through the UI. Log in with that account to reach `/admin`.

**The activity catalog starts empty.** Only an `ADMIN` can create activities (`POST /api/activity/`),
and nobody can log anything until at least one exists, so seed a few as the admin first (Study,
Running, …). Until then Log Activity answers every name with a not-found and an empty suggestion list.

New accounts show a "not ranked yet" state on the Today page until the backend's next rank
recompute (every 5 minutes by default).

## Scripts

| Script                               | What it does                          |
| ------------------------------------ | ------------------------------------- |
| `npm run dev`                        | Start the dev server                  |
| `npm run build`                      | Typecheck and build for production    |
| `npm run preview`                    | Serve the production build locally    |
| `npm run lint`                       | ESLint                                |
| `npm run format` / `format:check`    | Prettier (write / check)              |
| `npm run typecheck`                  | `tsc` without emitting                |
| `npm test` / `npm run test:watch`    | Vitest (once / watch)                 |

CI (`.github/workflows/ci.yml`) runs format check, lint, typecheck, tests and build on every pull
request and push to `main`.

## Project layout

```
src/
  app/          router, layouts (public / app / admin), providers, 403/404/error pages
  components/   shared UI kit (components/ui) and the logo
  features/     one folder per screen group: pages/, components/, api.ts, types.ts
  lib/
    api/        axios client, endpoints, query keys, shared types, error mapping
    auth/       session store, token storage, refresh logic, route guards
    utils/      formatting and small helpers
  styles/       design tokens (tokens.css) and Tailwind entry
  test/         Vitest setup, MSW server, test helpers
```

Feature folders gain their `api.ts` / `types.ts` when the screen is built. DTO field names come from
the backend source (or its `postman/` collection) at that point, never guessed.

## Auth

- Login/register store both tokens; the access token is decoded for `userId` and `role`.
- Every request carries `Authorization: Bearer <accessToken>`. The frontend never sends a `userId`
  header — the gateway derives it from the JWT.
- On a `401` the client calls `POST /auth/refresh` **once**, even if many requests fail at the same
  time, swaps both tokens (the backend rotates refresh tokens) and retries them. If the refresh
  fails the session is cleared and the user is sent to `/login?next=<path>`.
- On page load the stored refresh token restores the session before guarded routes render.

### Token storage trade-off

The access token lives only in memory (Zustand). The **refresh token is kept in `localStorage`** so a
reload doesn't log the user out. That makes it readable by any script running on the page, so an XSS
bug could leak it. Mitigations are the usual ones (no `dangerouslySetInnerHTML`, careful
dependencies, a strict CSP when deploying). If the backend later supports an `httpOnly` cookie for
the refresh token, move it there and drop `localStorage`.

## Design tokens

Colours and fonts are CSS variables in `src/styles/tokens.css`, mapped into Tailwind utilities in
`src/styles/index.css` (`bg-surface`, `text-muted`, `text-accent`, `font-display`, …). Tailwind v4
keeps this mapping in CSS (`@theme inline`) rather than in a `tailwind.config.ts`.

The app is dark-first, mobile-first (bottom tab bar on phones, side nav on desktop), keeps touch
targets at least 44px and respects `prefers-reduced-motion`.

## Notes on the backend

- Errors from every service are RFC 7807 `ProblemDetail` bodies; `lib/api/errors.ts` turns them into
  readable messages.
- `RankCard.percentile` is really a **top fraction** (0 = best user, 0.25 = top 25%).
- `GET /api/ranks/me` returns `404` until the user has been ranked.
- An unmatched activity name on `POST /api/activitylog/` returns a `404` carrying `suggestions`;
  `getActivitySuggestions()` extracts them for the "Did you mean…?" prompt.

## Not in this phase

Badges, profile and settings, and admin user management need backend work first (see the gaps
section of `etram-screens.md`).
