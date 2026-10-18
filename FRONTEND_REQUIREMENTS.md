# Etram Frontend — Scaffolding Requirements

Requirements for scaffolding the web frontend of **Etram**, the UI for the `gamified_tracker` backend.
Source of screens: `etram-screens.md`.

**Scope of this phase:** a running, routed, authenticated *skeleton* — every screen exists as a
route with a placeholder page, the API layer and auth flow work end to end, and the design tokens
are in place. Real screen UIs are built afterwards, one at a time.

---

## 1. Tech stack

Use the latest stable version of each package at scaffold time.

| Concern | Choice | Notes |
|---|---|---|
| Build / dev server | **Vite** | `react-ts` template |
| Language | **TypeScript**, `strict: true` | No `any` in committed code |
| UI library | **React** | Function components + hooks only |
| Routing | **React Router** (data router: `createBrowserRouter`) | Route guards via loaders/layout components |
| Server state | **TanStack Query** | All API reads/writes go through query/mutation hooks |
| Client state | **Zustand** | Auth session only (tokens, decoded user) — keep it tiny |
| HTTP | **Axios** | One shared instance with auth + refresh interceptors |
| Forms | **React Hook Form** + **Zod** | Zod schemas mirror backend DTO validation |
| Styling | **Tailwind CSS** | Design tokens as CSS variables (see §6) |
| Charts | **Recharts** | Stats screen only |
| Icons | **lucide-react** | No emoji as icons |
| JWT decode | **jwt-decode** | Read `userId` and `role` claims |
| Testing | **Vitest** + **React Testing Library** + **MSW** | MSW mocks the gateway in tests |
| Lint / format | **ESLint** (typescript-eslint, react-hooks) + **Prettier** | Run in CI |

Out of scope for now: SSR, i18n, PWA/offline (keep the door open for a PWA later).

---

## 2. Backend contract (verified from the repo)

- **Gateway base URL:** `http://localhost:8080` in dev (Docker Compose maps `8080:8080`).
  Read from `VITE_API_BASE_URL`.
- **Auth endpoints are NOT prefixed:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`.
- **All other endpoints are prefixed with `/api`** (e.g. `/api/ranks/me`, `/api/activitylog/`).
- **CORS:** the gateway reads `CORS_ALLOWED_ORIGINS`. Set it to `http://localhost:5173` in the
  backend `.env`, or use the Vite dev proxy (§8) and skip CORS in dev.

### Auth DTOs

```ts
// POST /auth/register  — role is never sent; self-registration always yields USER
type RegisterRequest = { firstName: string; lastName: string; email: string; password: string };

// POST /auth/login
type LoginRequest = { email: string; password: string };

// POST /auth/refresh
type RefreshRequest = { refreshToken: string };

// All three return:
type AuthResponse = { accessToken: string; refreshToken: string };
```

### JWT access token claims

- `userId` — numeric user id. Use it for path params such as `/api/activitylog/user/{id}`.
- `role` — `"USER"` or `"ADMIN"`.

Admins are provisioned on the backend (`app.admin.bootstrap.*`), never through the UI.

---

## 3. Directory structure

Feature-based: each feature owns its pages, components, API hooks and types.
Numbers in comments refer to the screen numbers in `etram-screens.md`.

```
etram-web/
├── .env.example                  # VITE_API_BASE_URL=http://localhost:8080
├── index.html
├── vite.config.ts                # dev proxy, path alias @ -> src
├── tailwind.config.ts
├── src/
│   ├── main.tsx                  # providers: QueryClient, Router
│   ├── app/
│   │   ├── router.tsx            # all routes (see §4)
│   │   ├── providers.tsx
│   │   └── layouts/
│   │       ├── PublicLayout.tsx  # visitor pages (nav + footer)
│   │       ├── AppLayout.tsx     # logged-in shell: nav, notification bell
│   │       └── AdminLayout.tsx   # admin shell + admin nav
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts         # axios instance + interceptors (§5)
│   │   │   ├── endpoints.ts      # every path as a constant/function
│   │   │   └── queryKeys.ts      # central TanStack Query key factory
│   │   ├── auth/
│   │   │   ├── authStore.ts      # Zustand: tokens, user {id, role}
│   │   │   ├── tokenStorage.ts   # persistence (see §5)
│   │   │   ├── RequireAuth.tsx   # guard: logged in
│   │   │   └── RequireRole.tsx   # guard: role === ADMIN
│   │   └── utils/                # formatting (XP, dates, durations)
│   ├── components/
│   │   └── ui/                   # Button, Card, Input, Badge, ProgressBar,
│   │                             # Modal, Toast, EmptyState, Skeleton, Tabs
│   ├── features/
│   │   ├── landing/              # 1  LandingPage (port the hero design)
│   │   ├── auth/                 # 2  LoginPage, RegisterPage
│   │   ├── home/                 # 3  TodayPage
│   │   ├── log-activity/         # 4,5 LogActivityPage, LogResultPage
│   │   ├── history/              # 6  HistoryPage, LogDetailPage
│   │   ├── activities/           # 7  ActivityDetailPage
│   │   ├── ranks/                # 8  RanksPage, TierLeaderboardPage
│   │   ├── stats/                # 9  StatsPage
│   │   ├── coach/                # 10 WeeklyCoachPage
│   │   ├── notifications/        # 11 NotificationsPage
│   │   └── admin/
│   │       ├── review/           # 12 ReviewQueuePage
│   │       ├── catalog/          # 13 ActivityCatalogPage
│   │       ├── leveling/         # 14 LevelingRulesPage
│   │       └── system/           # 15 SystemToolsPage
│   ├── styles/
│   │   └── tokens.css            # design tokens (§6)
│   └── test/
│       ├── setup.ts
│       └── msw/handlers.ts       # mock gateway responses
└── README.md
```

Each `features/<name>/` folder follows the same internal shape:

```
features/ranks/
├── pages/RanksPage.tsx
├── components/                   # RankCard, TierLadder, LeaderboardTable
├── api.ts                        # useMyRank(), useTierLeaderboard(tier) …
└── types.ts                      # RankCardDto, LeaderboardEntryDto …
```

---

## 4. Routes

| Path | Page | Guard | Layout |
|---|---|---|---|
| `/` | LandingPage | public (redirect to `/app` if logged in) | Public |
| `/login` | LoginPage | public | Public |
| `/register` | RegisterPage | public | Public |
| `/app` | TodayPage | RequireAuth | App |
| `/app/log` | LogActivityPage | RequireAuth | App |
| `/app/log/result/:logId` | LogResultPage | RequireAuth | App |
| `/app/history` | HistoryPage | RequireAuth | App |
| `/app/history/:logId` | LogDetailPage | RequireAuth | App |
| `/app/activities/:activityId` | ActivityDetailPage | RequireAuth | App |
| `/app/ranks` | RanksPage | RequireAuth | App |
| `/app/ranks/:tier` | TierLeaderboardPage | RequireAuth | App |
| `/app/stats` | StatsPage | RequireAuth | App |
| `/app/coach` | WeeklyCoachPage | RequireAuth | App |
| `/app/notifications` | NotificationsPage | RequireAuth | App |
| `/admin` | → redirect `/admin/review` | RequireRole(ADMIN) | Admin |
| `/admin/review` | ReviewQueuePage | RequireRole(ADMIN) | Admin |
| `/admin/catalog` | ActivityCatalogPage | RequireRole(ADMIN) | Admin |
| `/admin/leveling` | LevelingRulesPage | RequireRole(ADMIN) | Admin |
| `/admin/system` | SystemToolsPage | RequireRole(ADMIN) | Admin |
| `*` | NotFoundPage | — | Public |

- Lazy-load every page (`React.lazy` / route `lazy`) so admin code never ships to regular users.
- Non-admins hitting `/admin/*` see a 403 page, not a redirect loop.

---

## 5. Auth flow

1. **Login/Register** → store `accessToken` + `refreshToken`, decode the access token into
   `{ userId, role }`, then navigate to `/app` (or `/admin` for ADMIN).
2. **Every request:** the Axios request interceptor adds `Authorization: Bearer <accessToken>`.
3. **On 401:** the response interceptor calls `POST /auth/refresh` **once**, swaps both tokens
   (the backend rotates refresh tokens), and retries the original request.
   - Concurrent 401s must share one in-flight refresh promise. Never fire parallel refreshes.
   - If the refresh fails → clear the session and redirect to `/login?next=<current path>`.
4. **Logout:** clear the store and storage, and call `queryClient.clear()`.
5. **Storage:** keep the access token in memory (Zustand) and the refresh token in
   `localStorage` (document the XSS trade-off in the README; move to an httpOnly cookie if the
   backend later supports it).
6. **Never** send `userId` in a header — the gateway derives it from the JWT. Only use `userId`
   from the decoded token in path params where an endpoint requires it.

---

## 6. Design tokens (from the hero design)

Define these as CSS variables in `styles/tokens.css` and map them in `tailwind.config.ts`.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0D0F14` | Page background |
| `--surface` | `#141821` | Cards, panels |
| `--surface-2` | `#1C212B` | Raised items, list rows |
| `--line` | `#262C38` | Borders, dividers, bar tracks |
| `--text` | `#F3F1EA` | Primary text |
| `--text-muted` | `#9AA3B2` | Secondary text |
| `--accent` | `#C8F25A` | Primary actions, progress, active states |
| `--xp` | `#FFB547` | XP values |
| `--streak` | `#FF8A3D` | Streak indicators |
| `--rank` | `#8FA8FF` | Rank and leaderboard accents |

- **Fonts (Google Fonts):** Bricolage Grotesque (display), DM Sans (body), JetBrains Mono (numbers, XP, labels).
- **Theme:** dark-first. Light theme is not required in this phase.
- **Accessibility:** text contrast at least 4.5:1, touch targets at least 44px, visible focus rings, and `prefers-reduced-motion` respected for all animations.
- **Responsiveness:** mobile-first. At phone width the app shell uses a bottom tab bar (Today · Log · Ranks · Stats · More); at desktop width, a side nav.

---

## 7. Shared domain types

Put shared domain types in `src/lib/api/types.ts`. Feature-specific DTOs live in each feature's `types.ts`.

```ts
export type Role = 'USER' | 'ADMIN';

export type RankTier =
  | 'SUMMIT' | 'PEAK' | 'RIDGE' | 'ALPINE' | 'ASCENT'
  | 'HIGHLAND' | 'FOOTHILL' | 'TRAILHEAD' | 'BASECAMP';

// mirrors gamification-service RankCardDto
export type RankCard = {
  tier: RankTier;
  overallLevel: number;
  totalXp: number;
  percentile: number;
  position: number;
  totalUsers: number;
  updatedAt: string; // ISO LocalDateTime
};
```

Also include a `RANK_TIERS` constant: display name, percentile band and order (Basecamp → Summit). It's used by the tier ladder.

Generate or verify the remaining DTOs (activity log, level tracker, threshold, notification, analytics, insights) from the backend source (or the `postman/` collection) when each screen is built. **Do not guess field names.**

---

## 8. Dev setup & scripts

- **`vite.config.ts`:** proxy `/api` and `/auth` to `http://localhost:8080`, so the browser makes same-origin requests in dev.
- **`.env.example`:** `VITE_API_BASE_URL=` (empty in dev, because the proxy is used).
- **npm scripts:** `dev`, `build`, `preview`, `lint`, `format`, `test`, `test:watch`, `typecheck`.
- **README:** explain how to start the backend (`docker compose up -d`), set `CORS_ALLOWED_ORIGINS` (only needed without the proxy), run the frontend, and promote a user to ADMIN via the bootstrap properties.

---

## 9. Error, loading & empty states

These are required on every page from day one:

- **Loading:** skeleton placeholders, not spinners, for lists and cards.
- **Error:** an error panel with a retry button. Map the gateway's error body to a readable message.
- **Empty:** a friendly empty state with a call to action. For example, History with no logs shows "Log your first activity".
- **Global:** a toast system for mutation results (logged, approved, rejected).
- **Fuzzy match miss:** when `POST /api/activitylog/` returns activity-name suggestions, show them in the Log screen as "Did you mean …?" instead of a generic error.
- **Pending review:** a log saved with XP withheld must show a distinct **Pending review** state, never a success screen showing XP.

---

## 10. Definition of done for the scaffold

- [ ] `npm run dev` starts the app; `npm run build`, `lint`, `typecheck` and `test` all pass.
- [ ] Every route in §4 renders its placeholder page inside the correct layout.
- [ ] Register → login → land on `/app` works against the real gateway.
- [ ] The token refresh-on-401 flow is covered by an MSW test, including concurrent requests.
- [ ] RequireAuth and RequireRole guards are covered by tests.
- [ ] TodayPage makes one real call (`GET /api/ranks/me`) and renders the tier, proving the whole stack works.
- [ ] Design tokens and fonts are applied; the app shell works at 390px and 1440px widths.
- [ ] CI runs lint, typecheck, test and build on pull requests (GitHub Actions).

---

## 11. Not in this phase

These need backend work first (see `etram-screens.md` → Gaps):

- Badges / trophy case
- Profile & settings
- Admin user management
