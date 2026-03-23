---
name: supabase
description: Supabase — local dev, migrations, auth, edge functions, storage, type generation
---

You are now equipped with Supabase CLI expertise.

## Prerequisites

Ensure Supabase CLI is installed (`npm i -g supabase` or `npx supabase`), authenticated (`supabase login`), and Docker is running (required for local dev).

## Project Setup

- Initialize: `supabase init` (creates `supabase/` directory with `config.toml` and `migrations/`)
- Link to remote project: `supabase link --project-ref <project-id>` (project ref is in dashboard URL)
- Unlink: `supabase unlink`

## Local Development

- Start all local services: `supabase start` (runs Postgres, Auth, Storage, PostgREST, Realtime, Edge Functions, Studio in Docker)
- Check status and get local URLs/keys: `supabase status`
- Stop: `supabase stop`
- Stop and reset all data: `supabase stop --no-backup`
- Reset database to current migrations: `supabase db reset` (DESTRUCTIVE — drops and recreates)

## Migrations

- Create new migration: `supabase migration new <name>`
- Apply pending migrations locally: `supabase migration up`
- Roll back last N: `supabase migration down --count <n>`
- List migration status: `supabase migration list`
- Squash migrations: `supabase migration squash`

## Database Operations

- Push migrations to remote: `supabase db push`
- Pull remote schema into local migration: `supabase db pull`
- Auto-generate migration from local changes: `supabase db diff --schema public -f <migration_name>`
- Run SQL query: `supabase db query 'SELECT * FROM my_table LIMIT 10'`
- Dump schema: `supabase db dump --schema public`
- Lint database: `supabase db lint`

**Key distinction:** `db push` = apply to REMOTE. `migration up` = apply LOCALLY.

## Edge Functions

- Create: `supabase functions new <name>` (creates `supabase/functions/<name>/index.ts`)
- Serve locally (hot-reload): `supabase functions serve`
- Deploy one: `supabase functions deploy <name>`
- Deploy all: `supabase functions deploy`
- List deployed: `supabase functions list`
- Delete: `supabase functions delete <name>`

## Type Generation

- From local schema: `supabase gen types typescript --local > src/types/database.ts`
- From remote: `supabase gen types typescript --linked > src/types/database.ts`
- Specific schemas: `supabase gen types typescript --local --schema public,auth`

Run this after every schema change to keep TypeScript types in sync.

## Storage

- List objects: `supabase storage ls ss:///bucket-name/path/`
- Upload: `supabase storage cp ./file.png ss:///bucket/path/file.png`
- Download: `supabase storage cp ss:///bucket/path/file.png ./file.png`
- Delete: `supabase storage rm ss:///bucket/path/file.png`
- Target local storage: add `--local` flag

## Secrets (Edge Function env vars)

- List: `supabase secrets list`
- Set: `supabase secrets set MY_KEY=value ANOTHER=value2`
- Unset: `supabase secrets unset MY_KEY`

## Key Gotchas

- Docker MUST be running before `supabase start`.
- Always `supabase link` before any remote command (`db push`, `db pull`, `migration list`).
- `supabase db diff -f <name>` is the easiest way to create migrations — make changes, then diff.
- `supabase db reset` drops everything locally and replays migrations + seeds.
- Secrets are for Edge Functions, not the database.
- Use `--schema public,auth,storage` to target specific schemas on diff/dump/gen.
- Most commands support `-o json` for scripting.
