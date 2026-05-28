# Notion Clone

A production-grade collaborative workspace app built with:

- **Frontend**: Svelte 5 + Vite + TailwindCSS v4
- **Backend**: Bun + Elysia 1.x
- **DB/ORM**: PostgreSQL + Drizzle ORM
- **Auth**: Better-Auth (email/password, HTTP-only cookies)
- **Real-time**: Liveblocks + Y.js + TipTap (collaborative editing)
- **Type safety**: Elysia Eden Treaty (RPC), Valibot schemas shared between client and server
- **Services**: Effect.ts for typed business logic with DI

## Project Structure

```
/client          # Svelte 5 + Vite app
/server          # Elysia API server
/shared          # Shared Valibot schemas + TypeScript types
drizzle.config.ts
package.json
```

## Running Locally

### Prerequisites
- Bun >= 1.0
- PostgreSQL running on localhost:5432

### Setup

```bash
# 1. Copy env and fill in values
cp .env.example .env

# 2. Install all dependencies
bun install
cd client && bun install && cd ..

# 3. Create database
createdb notion_clone

# 4. Run migrations
bun run db:migrate

# 5. Start dev servers
bun run dev
```

Server → http://localhost:3000  
Client → http://localhost:5173

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLIENT_URL` | Frontend URL for CORS |
| `LIVEBLOCKS_SECRET_KEY` | From liveblocks.io dashboard |
| `LIVEBLOCKS_PUBLIC_KEY` | From liveblocks.io dashboard |
| `BETTER_AUTH_SECRET` | Random string, min 32 chars |

## User Preferences

- TypeScript strict mode everywhere, no `any`
- Files under 200 lines, split by feature
- Svelte 5 runes: `$state`, `$derived`, `$effect`
- Effect.ts for all business logic; no raw try/catch in services
- Valibot schemas live in `/shared` and are reused client+server
