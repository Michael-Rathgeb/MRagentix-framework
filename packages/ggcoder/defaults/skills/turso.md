---
name: turso
description: Turso — edge SQLite databases, replicas, groups, tokens
---

You are now equipped with Turso CLI expertise.

## Prerequisites

Ensure Turso CLI is installed (`curl -sSfL https://get.tur.so/install.sh | bash` or `brew install tursodatabase/tap/turso`) and authenticated (`turso auth login`).

## Database Management

- Create database: `turso db create mydb`
- Create in specific group: `turso db create mydb --group us-east`
- Create from SQLite file: `turso db create mydb --from-file ./local.db`
- List databases: `turso db list`
- Show details (URL, regions, size): `turso db show mydb`
- Get connection URL only: `turso db show mydb --url`
- Get HTTP URL: `turso db show mydb --http-url`
- Delete: `turso db destroy mydb`

## Interactive Shell

- Open SQL shell: `turso db shell mydb`
- Execute single statement: `turso db shell mydb "SELECT * FROM users;"`
- Execute from file: `turso db shell mydb < schema.sql`

## Database Tokens

- Create auth token: `turso db tokens create mydb`
- Read-only token: `turso db tokens create mydb --read-only`
- Token with expiration: `turso db tokens create mydb --expiration 7d`
- Long-lived token: `turso db tokens create mydb --expiration none`
- Invalidate all tokens: `turso db tokens invalidate mydb`

Store tokens as `TURSO_AUTH_TOKEN` in your environment.

## Groups & Replicas

- Create group: `turso group create us-group --location iad`
- Add replica location: `turso group locations add us-group ord`
- Remove replica: `turso group locations remove us-group ord`
- Show group details: `turso group show us-group`
- List groups: `turso group list`
- List all available locations: `turso db locations`
- Delete group: `turso group destroy us-group`

## Production Setup Pattern

```bash
turso group create prod --location iad
turso group locations add prod lhr    # London
turso group locations add prod nrt    # Tokyo
turso db create prod-db --group prod
turso db tokens create prod-db --expiration none
turso db show prod-db --url
```

## Auth

- Login: `turso auth login`
- Signup: `turso auth signup`
- Check status: `turso auth whoami`
- Get API token: `turso auth token`
- Logout: `turso auth logout`

## Key Gotchas

- Connection URLs use `libsql://` protocol: `libsql://dbname-orgname.turso.io`
- Writes go to primary; reads served from nearest replica.
- Database tokens are separate from CLI login. Generate with `turso db tokens create`.
- For local dev, use `file:local.db` URL with `@libsql/client` or run local libSQL server.
- `--from-file` is great for seeding databases from SQLite files.
- Embedded replicas give lowest latency — sync local SQLite with `syncUrl`.
- For Drizzle: `dialect: "turso"` in drizzle.config.ts.
- For Prisma: use `@prisma/adapter-libsql` with `driverAdapters` preview feature.
- For Cloudflare Workers: use `@libsql/client/web` (HTTP transport).
