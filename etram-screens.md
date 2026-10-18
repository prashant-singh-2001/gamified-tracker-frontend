# Etram — Screen Map

Screens for each type of user, based on the `gamified_tracker` repo. Each screen lists the API endpoint it would call.

The backend knows three kinds of user:

- **Visitor** — not logged in.
- **USER** — a regular logged-in user.
- **ADMIN** — can use the endpoints the API gateway restricts with `hasRole("ADMIN")`.

The roles come from the `Role` enum (`USER`, `ADMIN`) in `api-gateway`.

---

## Visitor (not logged in)

| # | Screen | What it shows | Endpoints |
|---|--------|---------------|-----------|
| 1 | **Landing / Hero** | App name, headline, animated preview (quests → XP → level → rank), sign-up and log-in buttons | — |
| 2 | **Sign up / Log in** | Register and login forms. The session is renewed silently with the refresh token. | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |

---

## User

| # | Screen | What it shows | Endpoints |
|---|--------|---------------|-----------|
| 3 | **Today (Home)** | XP bar and level, rank card, current streaks, and a main "Log activity" button | `GET /ranks/me`, `GET /activitylog/streaks/user/{id}`, `GET /notifications/unread-count` |
| 4 | **Log activity** | Two modes: type a sentence (natural language) or fill in a form. If the activity name doesn't match, show "Did you mean…?" suggestions from the fuzzy matcher. | `POST /activitylog/natural`, `POST /activitylog/`, `GET /activity/` |
| 5 | **Log result** | XP earned, streak multiplier, and any level-up. Also a **Pending review** state: unusually long sessions are saved but their XP is held back until reviewed. | response of `POST /activitylog/` |
| 6 | **History** | Past logs, each with a status: approved, pending or rejected | `GET /activitylog/user/{id}`, `GET /activitylog/{id}` |
| 7 | **Activity detail** | Your level in that activity and the thresholds to reach the next level | `GET /level/user/{userId}`, `GET /threshold/activity/{activityId}` |
| 8 | **Rank & Leaderboards** | Your tier, position and percentile; the leaderboard for your tier; global and per-activity boards; the full ladder of nine tiers from Basecamp to Summit | `GET /ranks/me`, `GET /ranks/me/leaderboard`, `GET /ranks/{tier}/leaderboard`, `GET /ranks`, `GET /leaderboard`, `GET /leaderboard/activity/{activityId}`, `GET /leaderboard/me` |
| 9 | **Stats** | XP over time, XP by category, week-over-week report, best time of day | `GET /activitylog/analytics/user/{userId}/xp-over-time`, `…/category-summary`, `…/weekly-report`, `…/best-time-of-day` |
| 10 | **Weekly coach** | The AI weekly digest. It's opt-in, so the screen also needs a friendly "not enabled" state. | `GET /insights/weekly` |
| 11 | **Notifications** | Level-up feed, with an unread count and mark-as-read | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/{id}/read` |

### Rank tiers (from `RankTier`)

Tiers are assigned by percentile among all users:

| Tier | Percentile band |
|------|-----------------|
| Summit | top 5% |
| Peak | 5–15% |
| Ridge | 15–25% |
| Alpine | 25–50% |
| Ascent | 50–60% |
| Highland | 60–75% |
| Foothill | 75–85% |
| Trailhead | 85–95% |
| Basecamp | bottom 5% |

Ranks are recomputed every 5 minutes by default (`ranking.recompute-interval-ms`).

---

## Admin

| # | Screen | What it shows | Endpoints |
|---|--------|---------------|-----------|
| 12 | **Review queue** | Flagged sessions, with approve and reject buttons. This is the most important admin screen, because it keeps fake XP off the leaderboard. | `GET /activitylog/review/flagged`, `POST /activitylog/review/{id}/approve`, `POST /activitylog/review/{id}/reject` |
| 13 | **Activity catalog** | View and create activities | `GET /activity/`, `POST /activity/` |
| 14 | **Leveling rules** | View and create level thresholds. These change the leveling curve for every user, so add a confirm step. | `GET /threshold`, `POST /threshold` |
| 15 | **System tools** | A "Recompute ranks now" button and a view of all level trackers | `POST /ranks/recompute`, `GET /level`, `GET /level/activity/{activityId}` |

---

## Gaps: features that need backend work first

| Screen | Why it's blocked |
|--------|------------------|
| **Badges / Trophy case** | `AchievementServiceImpl.evaluateAndAward` is implemented but has no caller, and no controller exposes it |
| **Profile & settings** (name, avatar, AI-coach opt-in) | No profile or settings endpoint exists |
| **Admin user management** | No endpoints for listing users or changing their roles |

---

## Suggested build order

1. **Today (Home)** — #3
2. **Log activity** and **Log result** — #4, #5
3. **Rank & Leaderboards** — #8

These three are the core loop that the hero promises: log an activity → earn XP → level up → climb a rank.
