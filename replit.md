# Go-Getters

A productivity, accountability, and recognition app for ambitious teams and network marketing communities — with a web app (React + Vite) and mobile app (Expo React Native), both backed by a single shared PostgreSQL database via a central Express API server.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, routes at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Web: React + Vite + Wouter + Tailwind + shadcn/ui
- Mobile: Expo React Native

## Where things live

- `lib/db/src/schema/` — all database table definitions (users, sessions, tasks, goals, posts, post_likes, evidence, meetings, notifications, achievements, weekly_achievers, team_messages)
- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/api-server/src/lib/auth.ts` — auth middleware, password hashing, token generation
- `artifacts/go-getters-web/src/context/` — React contexts for web app (AuthContext, AppContext)
- `artifacts/go-getters/context/` — React contexts for mobile app (AuthContext, AppContext)
- `artifacts/go-getters-web/src/lib/api.ts` — web API client utility
- `artifacts/go-getters/lib/api.ts` — mobile API client utility

## Architecture decisions

- **Single API, two clients**: Both web and mobile apps talk to the same Express API server at `/api`. Web uses relative URLs; mobile uses `EXPO_PUBLIC_DOMAIN` env var.
- **Bearer token auth**: Sessions stored in PostgreSQL `sessions` table. Token = 32-byte hex random. TTL = 30 days.
- **Password hashing**: SHA-256 with app-level salt (`gg_salt_2024`). Simple for demo; upgrade to bcrypt for production.
- **Auth middleware pattern**: `requireAuth` attaches `_authUserId`, `_authUserRole`, `_authUser` to request (prefixed to avoid Express 5 type conflicts); `getAuth(req)` extracts them as typed strings.
- **Route param casting**: `String(req.params.X)` required before passing to drizzle `eq()` due to Express 5 typing `params` as `string | string[]`.
- **Optimistic UI**: Both contexts update local state immediately on mutations, then confirm with API call.

## Product

- **Dashboard**: Daily task tracker with completion stats, streaks, and upcoming meetings
- **Tasks**: Create, complete, and manage daily tasks with evidence attachment
- **Goals**: Weekly goal tracking with category grouping and progress tracking
- **Evidence**: Submit screenshots/links as proof of task completion; leaders/admins can approve or reject
- **Community**: Social feed with wins, motivation posts, and announcements; like posts
- **Leaderboard**: Ranked by points with streak and completion rate
- **Notifications**: Real-time alerts for achievements, reminders, and streak milestones
- **Team (Leader/Admin)**: View and manage team members, send messages and notes
- **Admin**: Approve/reject pending user applications with role assignment

## Demo Accounts (password: anypassword)

- `admin@gogetters.app` — Admin (Alex Rivera) — full access
- `leader@gogetters.app` — Leader (Marcus Johnson) — team management
- `member@gogetters.app` — Member (Sam Chen) — standard user

## User preferences

- Brand colors: `#00d8fe` (electric cyan) and `#444345` (dark charcoal)
- Dark theme by default

## Gotchas

- Run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — the db lib must be built first.
- Admin code for self-registration: `GOGETTERS2024`
- `pnpm --filter @workspace/db run push-force` to push schema without interactive confirmation.
- Mobile app reads `EXPO_PUBLIC_DOMAIN` for the API base URL.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
