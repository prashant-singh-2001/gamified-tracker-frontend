# Auth & admin

Auth screens carry the hero's look into a single focused form. The admin console keeps the same tokens but swaps the playful card stack for dense, scannable tables: admins are working, not playing.

## Sign up and Log in

Log in and Sign up are the two faces of **one flipping card**: Log in on the front, Sign up on the back. A toggle turns the card over in 3D, so switching modes feels like turning a page, not loading a new screen. The card sits centred on the dark background with the hero's rank trail drawn faintly behind it.

**The flip**

- **Toggle** — a single text link at the foot of each face ("New here? Create an account" / "Already climbing? Log in") turns the card. No separate toggle above it: one control per face keeps the card uncluttered.
- **Motion** — `rotateY(180deg)` over 600 ms with an ease-out curve; `perspective: 1200px` on the wrapper; each face has `backface-visibility: hidden`. The card lifts slightly (a scale of 1.02 and a deeper shadow) at the midpoint so it reads as a physical turn.
- **Height** — the back is taller (four fields vs two), so the card's height animates to the active face's height alongside the flip, instead of leaving empty space on the front.
- **Routes** — `/login` and `/register` both render the same card; the route decides which face is up, and flipping updates the URL with `replace`, so refresh and back behave.
- **Reduced motion** — with `prefers-reduced-motion`, the faces cross-fade in 150 ms instead of rotating.

**Faces**

- **Front · Log in** (`POST /auth/login`) — email, password with show/hide; primary "Log in".
- **Back · Sign up** (`POST /auth/register`) — first and last name side by side, email, password with show/hide and a strength hint; primary "Start at Basecamp". No role field: every sign-up is a regular user.

**Behaviour**

- **Accessibility** — only the face that is up is in the tab order and visible to screen readers (`inert` on the hidden face); focus moves to the first field after each flip; the flip links are real buttons.
- **Typed values** — the email carries across when flipping, so a user who started on the wrong face doesn't retype it.
- **Errors** — field-level messages from backend validation under each field; a wrong password shows one message above the form, never which field was wrong. An error never flips the card.
- **After success** — users go to Home; admins go to the Review queue.
- **Session expiry** — the refresh token renews silently; if that fails, return to the Log in face with "Your session ended, please log in again" and resume the page they were on.

There is no "Forgot password" endpoint, so leave the link out until one exists.

## Admin shell

The admin console is a separate layout at `/admin`, so admin tools never clutter the user app.

|  | User app | Admin console |
| --- | --- | --- |
| Navigation | Floating footer, raised Log button | Left rail: Review · Catalog · Leveling · System |
| Content | Cards, one column on phone | Tables and side panels, desktop-first |
| Accent use | Celebration (XP, level up) | Only for the primary action on a page |
| Header badge | Unread level-ups | Count of flagged sessions waiting |

A "Switch to app" link in the rail lets an admin check the user view.

## Review queue

The review queue is the most important admin screen: every decision here changes a user's XP and the leaderboard. Its design goal is "decide fast, decide right", so each row shows the evidence next to the buttons. Source: `GET /activitylog/review/flagged` (`ReviewQueueItemResponse`).

**Table columns** — user, activity, duration, logged at, XP on hold, and **why it was flagged**: "4.8× their usual 45 min" (this session's duration ÷ the user's `median`), "based on 12 past sessions" (`sampleSize`), with `modifiedZScore` as a severity bar so the most extreme rows stand out. When `basis` is `INSUFFICIENT_SAMPLES` or a fallback, say so: "few past sessions, rough estimate".

**Side panel** (opens on row click) — the full log, its notes, and a small strip of the user's last sessions for that activity, so the outlier is visible against the norm.

**Actions** — **Approve** (`POST /activitylog/review/{id}/approve`) releases the XP; **Reject** (`…/reject`) awards none. Both show the result inline and move to the next row. Keyboard shortcuts A / R / ↓ for fast triage. Reject asks for a one-click confirm, because it can't be undone from this screen.

**Empty state** — "Queue clear. No sessions need review."

## Activity catalog

The catalog lists every activity users can log; it decides what shows in the Log screen's type picker and in the "Did you mean" suggestions. Source: `GET /activity/`; create with `POST /activity/`.

- **Table** — name, category, XP multiplier, active toggle (read-only for now), description, created date. Sorted by category, then name.
- **New activity** (side panel) — name, category (Study, Work, Gaming, Chores, Health, Other), XP multiplier, description, Active. Next to the multiplier, show the category's default (Study and Work ×1.5, Health ×1.3, Other ×1.0, Chores ×0.8, Gaming ×0.5) so admins see when they override it.
- **Duplicate guard** — names are unique, so check as the admin types and warn before submit.

The API can only create activities. Editing, deactivating and deleting need backend endpoints before the table can offer them.

## Leveling rules

Leveling rules set how much XP each level costs, per activity, so a change here moves every user's progress at once. The screen is built to make that impact visible before saving. Source: `GET /threshold`; create with `POST /threshold`.

- **Activity picker** on the left; on the right, that activity's levels as a table (level, XP required) and a small line chart of the curve, so a jump or a dip is obvious.
- **Add a level** — level number and XP required, validated positive. The new point previews on the curve in accent before saving.
- **Confirm** — "This changes level progress for everyone who logs *Running*. Continue?"

Rules can only be added today, not edited or removed; the table is read-only apart from "Add level".

## System tools

System tools collects the maintenance actions, each as a card with a plain description of what it does.

| Card | Action | Endpoint | Guard |
| --- | --- | --- | --- |
| Recompute ranks | Recalculates every user's tier now instead of waiting for the 5-minute cycle; shows how many users were ranked | `POST /ranks/recompute` | Button disabled while running |
| Level trackers | Searchable table of every user's level per activity; filter by activity | `GET /level`, `GET /level/activity/{activityId}` | Read-only |
| Award XP manually | Target user, activity, XP (max 10,000 per award) | `POST /level` | Confirm step (the API stores no reason, so none is asked for) |

Manual XP skips the normal checks, so its dialog repeats the user, activity and amount back before the final click.

## Backend gaps across all screens

These are the API changes the designs above need; each screen falls back gracefully until they land.

| Gap | Screens affected | Fallback until then |
| --- | --- | --- |
| Display names on leaderboard and tier-board rows | Home, Rank & Leaderboards, Review queue | "Climber #ID" handles |
| Paging on `GET /activitylog/user/{id}` | History | Load all; filter client-side |
| Recent activities for quick picks | Home, Log Activity | Derive from History |
| XP to next tier on `GET /ranks/me` | Log Result rank nudge | Show tier and position |
| Mark all notifications read | Notifications | Per-row only |
| Edit / deactivate activities | Activity catalog | Create only |
| Edit / delete level thresholds | Leveling rules | Add only |
| Forgot / reset password | Log in | Link hidden |
| Profile and settings; badges | Not designed yet | — |
