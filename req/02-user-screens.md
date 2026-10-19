# User screens

These six screens reuse the core-loop pattern: a floating nav bar, a stack of cards, the floating footer with the raised Log button, and one primary action per screen. Each is reached from a card on Home or from the footer, and each card on Home is a preview of one of them.

## History

History is a reverse-chronological list of every log, grouped by day, so a user can check what counted and why. Source: `GET /activitylog/user/{id}`; tapping a row opens `GET /activitylog/{id}`.

**Layout**

1. **Filter row** — chips for category (Study, Work, Gaming, Chores, Health, Other) and status (All · Pending · Rejected). Filtering is client-side, because the endpoint returns the full list.
2. **Day headers** — "Today · 210 XP", "Yesterday · 95 XP": the day's XP total in JetBrains Mono.
3. **Log rows** — category icon, activity name, time range and duration, XP on the right. A status pill appears only when it isn't Cleared, so normal rows stay quiet.

**Log detail (bottom sheet)** — the Log Result receipt reused: activity, time, XP with its bonus and streak multipliers, notes, and the name-resolution note if the name was auto-matched. Pending rows explain "An admin is reviewing this unusually long session"; rejected rows say "No XP awarded".

| Status | Pill | XP shown as |
| --- | --- | --- |
| `CLEARED` | none | "+120 XP" |
| `FLAGGED` | Pending (grey, clock icon) | "120 XP on hold" in grey |
| `APPROVED` | Approved (accent) | "+120 XP" |
| `REJECTED` | Rejected (critical) | "0 XP" |

**Empty state** — "No logs yet" with the Log button. **Scale note:** the endpoint has no paging, so ask for `?page=&size=` before lists grow past a few hundred rows.

## Activity detail

Activity detail shows how far the user is in one activity and what the next level costs. It opens from a History row, a quick-pick chip (long-press) or a level-up notification.

**Layout**

1. **Header** — activity name, category, and its XP multiplier as a chip ("×1.5 XP"), from the catalog entry.
2. **Level ring** — a large ring with the level number inside, filled to `progressPercent`; below it "340 / 500 XP to level 8" from `currentLevelXp` and `xpForNextLevel`. Source: the matching row of `GET /level/user/{userId}`.
3. **Streak card** — current and longest streak, plus the last day logged, from that activity's `StreakResponse`.
4. **Level ladder** — the next five levels with the XP each needs, from `GET /threshold/activity/{activityId}`. Past levels are ticked; the current one is highlighted.
5. **Recent sessions** — the last five logs for this activity, filtered from History.
6. **Primary action** — "Log this activity" opens Log Activity with the type filled in.

**First time:** an activity with no tracker yet shows level 1 at 0% and "Log it once to start levelling".

## Rank & Leaderboards

This screen is the full version of Home's two leaderboard cards: where I stand, how the tiers are filled, and who is ahead. It uses three tabs under one header.

**Header — my rank** (`GET /ranks/me`): tier badge, tier name, "#14 of 120", percentile and overall level. Under it, "Rank updates every few minutes" in muted text.

**Tab 1 · Mountain** — the nine tiers drawn as a vertical climb, Summit at the top and Basecamp at the bottom, the user's marker on their tier. Each tier shows its band ("top 5%") and how many people are in it, from `GET /ranks` (`RankDistributionDto.userCount`). Tapping a tier opens Tab 2 on that tier. This is the trail from the hero, turned upright.

**Tab 2 · Tier board** — a tier switcher (chips Basecamp → Summit, defaulting to the user's tier) above a ranked list from `GET /ranks/{tier}/leaderboard`. Each row shows the position within the tier, name, overall level and XP. The user's own row stays pinned to the bottom when it scrolls out of view.

**Tab 3 · Global** — the overall board from `GET /leaderboard`, with a filter for one activity (`GET /leaderboard/activity/{activityId}`), such as "Top in Running". The user's own row is pinned from `GET /leaderboard/me`.

**Names:** both boards return only `userId`. Until a display name is added, show "Climber #4821" style handles and "You" for the user's own row.

## Stats

Stats turns the four analytics endpoints into four charts, each answering one question. Every chart card has the question as its title and the answer as a big number above the chart.

| Card | Question | Big number | Chart | Source (`/activitylog/analytics/user/{userId}/…`) |
| --- | --- | --- | --- | --- |
| This week | Am I doing more than last week? | `currentWeekXp` with `percentageChange` (↑ 12%) | 7 daily bars, last week as a ghost outline behind | `weekly-report` |
| Trend | Am I consistent? | Active days in the range | Line of daily XP; range chips 7 · 30 · 90 days | `xp-over-time` |
| Where my time goes | What do I spend effort on? | Top category | Horizontal bars per category, minutes and XP | `category-summary` |
| Best time | When am I most productive? | `bestHour` ("9 AM") | 24 hourly bars, the best hour in accent; a note on `bestCategory` at `bestCategoryHour` | `best-time-of-day` |

**Rules for every chart:** one accent colour for "you", grey for comparison; XP values in JetBrains Mono; hover or tap shows the exact value; each card has an empty state ("Log 3 days to see a trend") instead of a blank axis.

**Desktop:** a 2 × 2 grid. **Phone:** one column in the order above, since "This week" is the most checked.

## Weekly coach

Weekly coach reads like a short letter, not a dashboard: the AI narrative first, the facts behind it underneath. Source: `GET /insights/weekly` (`WeeklyInsightsResponse`).

1. **Header** — "Your week, 13–19 Oct" from `weekStart`–`weekEnd`.
2. **Narrative card** — the `narrative` text set in larger body type (18px) with generous line height and a small "Written by your AI coach" label. Don't add chat bubbles or avatars: it is a summary, not a conversation.
3. **Facts strip** — three numbers from `totals`: week XP with change, active minutes, top category.
4. **Category list** — one row per category from `categories` (sessions, minutes, XP), sorted by XP.

| `narrativeStatus` | What the user sees |
| --- | --- |
| `GENERATED` | Full layout |
| `DISABLED` | The facts strip and categories, with a quiet note "AI coaching is off on this server" in place of the narrative |
| `UNAVAILABLE` | Facts as above, plus "Your coach couldn't write this week's note — try again later" with a Retry button |

The facts always come from the API numbers, never from the narrative, so the screen stays useful when the AI is off.

## Notifications

Notifications is a feed of level-ups; today it carries only that one kind (`LevelUpEventDto`), so each row can be specific and celebratory. Opens from the nav bell.

- **Row** — level badge "7 → 8" (`oldLevel` → `newLevel`), activity name, time ago from `createdAt`. Unread rows have an accent dot and a slightly raised surface.
- **Tap** — marks it read (`POST /notifications/{id}/read`) and opens Activity detail for `activityId`.
- **Top bar** — an All · Unread toggle (`?unreadOnly=true`). The bell badge uses `GET /notifications/unread-count` and refreshes when the app regains focus.
- **Empty** — "No level-ups yet. Your first one is closer than you think" with the Log button.

The API has no "mark all read". Leave that button out rather than firing one request per row; add it once a backend endpoint exists.
