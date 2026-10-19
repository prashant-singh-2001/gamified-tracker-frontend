# Etram — Frontend Design Plan

Screen-by-screen design spec for the Etram web app (React + Vite), grounded in the
`gamified_tracker` backend API. Use alongside `FRONTEND_REQUIREMENTS.md` and `etram-screens.md`.

| File | Covers |
| --- | --- |
| `01-core-loop.md` | Home, Log Activity, Log Result, app-wide design system (nav, components, tokens, motion) |
| `02-user-screens.md` | History, Activity detail, Rank & Leaderboards, Stats, Weekly coach, Notifications |
| `03-auth-and-admin.md` | Sign up / Log in, admin shell, Review queue, Activity catalog, Leveling rules, System tools, backend gaps |

Rules for implementing from this spec:
- Field names and endpoints quoted here were checked against the backend source; don't invent others.
- Where a section lists a backend gap, build the stated fallback, not the missing feature.
