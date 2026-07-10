# Corkbord

Repurpose one content feed across social channels. Import RSS (or create notes manually), generate per-channel AI previews on demand, then approve and schedule posts to X and LinkedIn.

Built with [Hyperspan](https://www.hyperspan.dev) and Bun.

## Setup

```bash
cp .env.example .env
createdb corkbord
bun install
bun run db:push
bun run dev
```

Open the URL printed by `portless` (typically `http://localhost:3000`).

## Stack

- **Hyperspan** — file-based routes, streaming HTML, Actions for forms
- **Bun** — runtime and package manager
- **Drizzle + Postgres** — persistence
- **better-auth** — email/password + organizations
- **DaisyUI + Tailwind CSS** — UI

## Project layout

- `app/routes` — pages and API routes
- `app/actions` — Hyperspan Actions (all form submissions)
- `app/layouts` — HTML document shells
- `src/server` — domain logic and queries
- `src/ui` — server-rendered HTML partials
- `src/db` — Drizzle schema (migrations in `drizzle/` — do not edit manually)

See `AGENTS.md` for conventions.
