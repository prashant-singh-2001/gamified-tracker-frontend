# Etram web

The web app for [`gamified_tracker`](https://github.com/prashant-singh-2001/gamified_tracker): log
what you did, earn XP, keep streaks alive and climb nine rank tiers from Basecamp to Summit. It
also has an admin console for reviewing flagged sessions and managing the activity catalog and the
level curve.

![CI](https://github.com/prashant-singh-2001/gamified-tracker-frontend/actions/workflows/ci.yml/badge.svg)

## What is in it

**The app** (`/app`, signed in)

| Screen | What it does |
| --- | --- |
| Home | Where you stand on the route to Summit, a quick Log card, this week, the climbers around you and the top of your tier |
| Log activity | Type a sentence or pick an activity; a confirm step, then a result with XP, level-ups and your rank |
| History | Every log as a trail of days, filtered by activity and date, sorted by date, XP or length, paged 50 at a time |
| Activity detail | Your level in one activity, its streak, the next levels and your last sessions |
| Ranks | Your tier and division with movement, the mountain of nine tiers, tier boards and the global board |
| Stats | Four charts: this week against last, consistency, where your time goes, your best hour |
| Weekly coach | A short written note about your week (when the backend's AI coach is on) and the numbers behind it |
| Notifications | Your level-ups, with Unread and mark all as read |

**The admin console** (`/admin`, `ADMIN` accounts only)

| Screen | What it does |
| --- | --- |
| Review queue | Approve or reject unusually long sessions, with the evidence beside each one and keyboard triage |
| Activity catalog | Create, edit, deactivate and delete activities |
| Leveling rules | Edit how much XP each level costs, with a curve preview and a confirm before every change |
| System tools | Recompute ranks, browse every user's level trackers, award XP manually |

Public pages: a landing page, and a flip card for log in and sign up, plus password reset.

## Stack

Vite · React 19 · TypeScript (strict) · React Router (data router, lazy routes) · TanStack Query ·
Zustand (the auth session only) · Axios · React Hook Form + Zod · Tailwind CSS v4 · lucide-react ·
Vitest + Testing Library + MSW · ESLint + Prettier.

Charts are small hand-drawn SVG components, not a chart library.

## Getting started

Requires Node 22 or newer (developed on Node 24) and the backend running.

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

`VITE_API_BASE_URL` is empty by default and the Vite dev server **proxies `/api` and `/auth` to
`http://localhost:8080`**, so the browser makes same-origin requests and no CORS setup is needed.
The proxy also strips the `Origin` header: browsers send it on POSTs even same-origin, and the
gateway's closed CORS policy would answer register and login with a bare `403 Invalid CORS request`.

To call the gateway directly, set `VITE_API_BASE_URL=http://localhost:8080` and add
`CORS_ALLOWED_ORIGINS=http://localhost:5173` to the backend `.env`.

### First run

- **An admin account** comes from the backend's `app.admin.bootstrap.*` properties, never from the
  UI: self-registration always creates a `USER`. Log in with that account to reach `/admin`.
- **The activity catalog starts empty.** Only an admin can create activities, and nobody can log
  anything until one exists. Seed a few from Admin, Activity catalog (Study, Running, ...).
- **New accounts are "not ranked yet"** until the backend's next rank refresh (about every 30
  seconds).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier (write / check) |
| `npm run typecheck` | `tsc` without emitting |
| `npm test` / `npm run test:watch` | Vitest (once / watch) |

CI (`.github/workflows/ci.yml`) runs the format check, lint, typecheck, tests and build on every
pull request and every push to `main`.

## Project layout

```
src/
  app/          router, layouts (public, app, admin), providers, 403 / 404 / error pages
  components/   shared UI kit (components/ui), the route map and the logo
  features/     one folder per screen group: pages/, components/, api.ts, types.ts
  lib/
    api/        axios client, endpoints, query keys, shared types, error mapping
    auth/       session store, token storage, refresh logic, route guards
    utils/      formatting, time and small helpers
  styles/       design tokens and the survey-sheet theme
  test/         Vitest setup, the MSW server, test helpers
req/            the screen-by-screen design spec
```

Every endpoint path lives in `src/lib/api/endpoints.ts` and every query key in
`src/lib/api/queryKeys.ts`. DTO field names come from the backend source and its `API.md`, never
guessed.

## How it works

### Auth

- Log in and register store both tokens; the access token is decoded for `userId` and `role`.
- Every request carries `Authorization: Bearer <accessToken>`. The frontend never sends a user id:
  the gateway takes it from the JWT.
- On a `401` the client calls `POST /auth/refresh` **once**, even when many requests fail together,
  swaps both tokens (the backend rotates refresh tokens) and retries them. If the refresh fails, the
  session is cleared and the user goes to `/login?next=<path>`.
- On page load the stored refresh token restores the session before guarded routes render.
- `/admin` is behind a role guard; a non-admin is redirected away.

**Token storage trade-off.** The access token lives only in memory. The **refresh token is kept in
`localStorage`** so a reload does not log the user out, which makes it readable by any script on
the page: an XSS bug could leak it. Avoid `dangerouslySetInnerHTML`, keep dependencies careful and
set a strict CSP when deploying. If the backend later supports an `httpOnly` cookie for the refresh
token, move it there and drop `localStorage`.

### Data and time

- Reads are TanStack Query hooks per feature (`features/<name>/api.ts`). Rank data refetches about
  every 30 seconds and on focus; the weekly coach's note is kept for 30 minutes because the server
  writes a new one on every request.
- The backend runs on UTC and sends zone-less timestamps. Everything is read as UTC and shown in
  the viewer's own time zone (`lib/utils/serverTime.ts`); hours in "best time of day" are shifted
  onto the local clock.
- Errors from every service are RFC 7807 `ProblemDetail` bodies. `lib/api/errors.ts` turns them
  into readable messages and field errors, and a `409` or `404` is handled where it means something.

### Design

The app uses a "survey sheet" look: glacier paper, crevasse ink and one route-magenta accent, with a
condensed display face (Sofia Sans Extra Condensed) and a serif body (Newsreader). Tokens are CSS
variables in `src/styles/` and mapped to Tailwind utilities in `src/styles/index.css`. The signed-in
app and the admin console follow the system light or dark theme. Each of the nine rank tiers has its
own colour and a mountain glyph that rises with the tier, so colour is never the only cue.

It is mobile first (a tab bar on phones, a side rail on desktop), keeps touch targets at least 44px,
shows visible keyboard focus and respects `prefers-reduced-motion`.

## Testing

Tests run in jsdom with the time zone pinned to `Asia/Kolkata` (a half-hour zone, so UTC to local
bugs show up). The MSW server runs with `onUnhandledFrame: 'error'` and **no default handlers**:
each test declares exactly the endpoints it expects, so an unexpected request fails the test.
Helpers in `src/test/helpers.tsx` render a route tree with a fresh query client and a signed-in
user.

## Backend notes

- `RankCard.percentile` is a **top fraction**: 0 is the best user, 0.25 is the top 25%.
- `GET /api/ranks/me?allowUnranked=true` answers `{"ranked": false}` instead of a `404` for a user
  who is not ranked yet.
- An unknown activity name on `POST /api/activitylog` is a `404` carrying ranked `suggestions`.
- Admins cannot look up other users, so admin tables show "User #id". Leaderboard and rank rows fall
  back to "Climber #id" when a name is missing.

## More documentation

- [`req/`](./req) is the design spec, screen by screen (start with its README).
- [`FRONTEND_REQUIREMENTS.md`](./FRONTEND_REQUIREMENTS.md) and [`etram-screens.md`](./etram-screens.md)
  are the original requirements and screen list.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) covers branches, commits and checks.

Not built yet: badges and a profile or settings screen, which need backend work first.
