# Contributing

Thanks for helping with Etram. This is how changes are made here.

## Set up

Follow [Getting started](./README.md#getting-started) in the README. You need Node 22 or newer and,
to use the real API, the backend running through Docker.

## Before you open a pull request

Run the same checks CI runs. All five must pass:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run format` fixes formatting. The Prettier settings are in `.prettierrc` (single quotes,
trailing commas, 100 columns).

## Branches, commits and pull requests

- Branch from `main`: `feature/<short-name>` for a screen or feature, `fix/<short-name>` for a bug,
  `docs/<short-name>` for documentation.
- Make small commits that each do one thing, with a message that says what changed and why, for
  example `feat(history): sort by date, XP or length` or `fix(ranks): keep the marker inside its row`.
  The prefix is `feat`, `fix`, `test`, `refactor`, `docs` or `chore`, with the area in brackets.
- One pull request per screen or change. Describe what it does and why, the differences from the
  spec, and how you tested it.
- **Stacked pull requests:** if a branch builds on another open branch, set its base to that branch
  and merge them into `main` in order. Merging a pull request into its stacked base does not put it on
  `main`.

## Conventions

- **Endpoints and field names** come from the backend source and its `API.md`. Add a path to
  `src/lib/api/endpoints.ts` and a key to `src/lib/api/queryKeys.ts`; do not build URLs inline.
- **A feature** lives in `src/features/<name>/` with `pages/`, `components/`, `api.ts` and `types.ts`.
  Put anything pure (sorting, wording, validation) in its own file so it can be unit tested.
- **Server errors** are `ProblemDetail` bodies. Show a `409` or a validation `errors` map on the field
  it names, and any other failure as a retryable error. Say what went wrong and what to do.
- **Time** from the API is UTC without an offset: read it with `fromServerDateTime` and send it with
  `toServerDateTime`. Show it in the viewer's local time.
- **Styling** uses the design tokens and Tailwind utilities (`bg-surface`, `text-muted`,
  `text-accent`). Do not hard-code colours; check both light and dark.
- **Accessibility:** every control reachable and operable by keyboard with visible focus, touch
  targets at least 44px, meaning never carried by colour alone, and motion switched off under
  `prefers-reduced-motion`.
- **Copy** is plain and in sentence case. A button says what it does ("Save changes", not "Submit"),
  and the same action keeps the same name in its toast.

## Tests

- Test behaviour a user can see (text, roles, what is sent to the API), not implementation details.
- The MSW server has no default handlers and errors on any request a test did not declare. Declare
  the endpoints each test needs (see `src/test/helpers.tsx` and any `*.test.tsx` for the pattern).
- Tests run with the time zone set to `Asia/Kolkata`. Pin dates to local times, not "N hours ago", so
  a test does not change meaning near midnight.
- New logic gets a unit test; each screen gets a page test covering its states (loading, empty,
  error and the main flows).

## Reporting a problem

Open an issue with what you did, what you expected and what happened. For a backend problem (a
missing field, an unexpected status), include the request and the response.
