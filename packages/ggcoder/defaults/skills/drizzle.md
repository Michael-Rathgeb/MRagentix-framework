---
name: drizzle
description: Drizzle Kit — generate migrations, push schema, studio, introspect
---

You are now equipped with Drizzle Kit CLI expertise.

## Prerequisites

Ensure Drizzle Kit is installed (`npm i -D drizzle-kit drizzle-orm`) and a `drizzle.config.ts` exists in the project root:

```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "postgresql",  // "postgresql" | "mysql" | "sqlite" | "turso" | "singlestore"
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

## Core Workflow

1. Define/edit schema in TypeScript (e.g., `src/db/schema.ts`)
2. Generate migration: `npx drizzle-kit generate`
3. Apply migration: `npx drizzle-kit migrate`
4. Open data browser: `npx drizzle-kit studio`

For rapid prototyping (no migration files): `npx drizzle-kit push`

## Commands

- **Generate migration** from schema changes: `npx drizzle-kit generate`
- **Apply migrations** to database: `npx drizzle-kit migrate`
- **Push schema** directly (no migration files): `npx drizzle-kit push`
- **Introspect** existing database into Drizzle schema: `npx drizzle-kit introspect`
- **Open Studio** (visual data browser): `npx drizzle-kit studio`
- **Check** migration consistency: `npx drizzle-kit check`
- **Upgrade** migration snapshots: `npx drizzle-kit up`
- **Drop** a migration (interactive): `npx drizzle-kit drop`
- **Export** full schema diff as SQL: `npx drizzle-kit export`

## Production Deploy

Generate migrations locally, commit them, then apply in CI:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Or apply programmatically in app startup:
```ts
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
await migrate(db, { migrationsFolder: "./drizzle" });
```

## Config Options

Key `drizzle.config.ts` options:
- `dialect`: postgresql, mysql, sqlite, turso, singlestore
- `schema`: path or glob to schema files (e.g., `"./src/db/schema/*.ts"`)
- `out`: output directory for migrations (default: `./drizzle`)
- `dbCredentials.url`: database connection URL
- `strict`: always ask confirmation on push
- `verbose`: show SQL during push/generate
- `tablesFilter`: glob to filter tables
- `migrations.table`: custom migration tracking table name (default: `__drizzle_migrations`)

## Key Gotchas

- Config file is REQUIRED. Every command reads `drizzle.config.ts`.
- `generate` only creates files — you must still run `migrate` to apply them.
- `push` vs `migrate`: push = direct apply (prototyping). migrate = file-based (production).
- Keep the `out` directory committed to version control.
- Studio requires a running, accessible database.
- For Turso: set `dialect: "turso"` with `dbCredentials: { url, authToken }`.
- For Supabase: use direct connection (port 5432), not pooled (port 6543).
