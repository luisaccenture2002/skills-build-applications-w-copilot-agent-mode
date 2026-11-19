# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep rendering and user interaction in React components under `frontend/src`; use the shared API client with relative `/api` paths, and show accessible loading, empty, and error states without duplicating backend business rules.
- Logic tier decision: Keep HTTP handling and request validation in the Express routes/services under `backend/src`; return the documented response shapes and deliberate 4xx responses for invalid or unknown input.
- Data tier decision: Keep persistence in Mongoose models and the seed script; model users, teams, activities, and workouts explicitly, and make seeding idempotent without deleting unrelated records.
- Activity tracking approach: Validate activity type, minutes, and well-formed IDs for an existing user and team before saving; calculate points and `occurredAt` on the server and persist the user/team references with the submitted activity fields.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot in create/list responses, and associate only valid member references.
- Leaderboard approach: Aggregate persisted activity points per team, sort by total points descending, and return each team name, total, and 1-based rank.
- Workout suggestions approach: Match the requested email to a user, use that user's goal and recent activity to choose relevant suggestions, explain the first suggestion with a reason, and return a deliberate 4xx when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — checks Mongoose model constraints and data behavior. Baseline: 4 failed, 1 passed; the user, team, activity, and workout schemas do not yet enforce required fields.
- API command: `npm run test:api --prefix octofit-tracker/backend` — checks route validation and activity, team, leaderboard, and suggestion contracts. Baseline: all 4 failed; invalid create requests return `501` instead of `400`, the leaderboard is empty, and workout suggestions omit the expected reason.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — checks API-driven content and accessible route states. Baseline: all 15 failed; expected activity/team/leaderboard content and user-specific suggestions are absent, and loading, empty, and error states fail across the four routes.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — checks backend TypeScript compilation. Not run in the baseline; a failure indicates a backend type or compile error.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — checks frontend TypeScript compilation and Vite production bundling. Not run in the baseline; a failure indicates a frontend type, compile, or bundle error.
