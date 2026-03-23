---
name: prisma
description: Prisma — schema management, migrations, generate client, studio
---

You are now equipped with Prisma CLI expertise.

## Prerequisites

Ensure Prisma is installed (`npm i -D prisma @prisma/client`) and `DATABASE_URL` is set in `.env`. Use `npx prisma` to run commands.

## Project Setup

- Initialize: `npx prisma init` (creates `prisma/schema.prisma` + `.env`)
- With specific DB: `npx prisma init --datasource-provider postgresql` (mysql|postgresql|sqlite|sqlserver|mongodb)
- Validate schema: `npx prisma validate`
- Format schema: `npx prisma format`

## Local Development Workflow

1. Edit `prisma/schema.prisma` to define/change models
2. Create and apply migration: `npx prisma migrate dev --name <descriptive_name>`
3. Generate client: `npx prisma generate` (happens automatically with migrate dev)
4. Open data browser: `npx prisma studio` (port 5555)

For rapid prototyping (no migration files): `npx prisma db push`

## Migrations

- Create + apply (dev only): `npx prisma migrate dev --name add_user_table`
- Apply pending in production: `npx prisma migrate deploy` (NEVER use migrate dev in production)
- Check status: `npx prisma migrate status`
- Reset database (DESTRUCTIVE): `npx prisma migrate reset`
- Resolve failed migration: `npx prisma migrate resolve --applied <migration_id>`
- Diff two schemas: `npx prisma migrate diff --from-url "$DB_URL" --to-url "$SHADOW_URL" --script`
- Execute raw SQL: `npx prisma db execute --stdin < migration.sql`

## Database Operations

- Push schema (no migration): `npx prisma db push`
- Pull/introspect existing DB: `npx prisma db pull`
- Seed: `npx prisma db seed`
- Generate client: `npx prisma generate`
- Watch mode: `npx prisma generate --watch`

## Production Deploy

Always use `npx prisma migrate deploy` in CI/production. This only applies existing migration files — never creates new ones. Add `prisma generate` to your build command or `postinstall` script:
```json
{ "scripts": { "postinstall": "prisma generate" } }
```

## Key Gotchas

- `migrate dev` = local development (creates files + applies + generates). `migrate deploy` = CI/production (applies only).
- Shadow database required for `migrate dev`. For cloud DBs (Supabase, PlanetScale), set `shadowDatabaseUrl` or use `db push`.
- Always run `prisma generate` after schema changes or pulling repo.
- Schema defaults to `prisma/schema.prisma`. Use `--schema` flag to override.
- `db push` vs `migrate dev`: push = rapid prototyping (no history). migrate dev = migration history for production.
- For Supabase: use direct connection (port 5432) for migrations, pooled (port 6543) for runtime.
- For PlanetScale: add `relationMode = "prisma"` (no foreign keys) and use `db push`.
- For serverless (Vercel): use Prisma Accelerate or connection pooler.
