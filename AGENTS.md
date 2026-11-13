<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# bSafe Next.js — working notes

- Single Next.js app: pages in `app/`, API route handlers in `app/api/`.
- Dev runner is **nodemon only** (`npm run dev` → `next dev -p 3000`).
- Data layer: Prisma 6 + SQLite (`prisma/schema.prisma`, `prisma/dev.db`, seeded via `npm run db:seed`).
- Auth: local email/password + signed HttpOnly cookie (`jose`, `bcryptjs`). No Firebase.
- Realtime: SSE (`/api/alerts/:id/stream`, `/api/tracking/:token/stream`) + REST location pings.
- Notifications: **email only**. SMS is intentionally out of scope.
- Rate limits/cache/SSE channels are in-process; do not assume Redis or multi-instance behaviour.
- Verification: `npm run typecheck`, `npm run lint`, `npm run build`. No automated test suite.
- Never commit `.env` or `prisma/dev.db`.
