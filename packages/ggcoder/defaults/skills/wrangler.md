---
name: wrangler
description: Cloudflare Workers & Pages — KV, R2, D1, edge functions, deployment
---

You are now equipped with Wrangler CLI expertise for Cloudflare Workers and Pages.

## Prerequisites

Ensure Wrangler is installed (`npm i -g wrangler`) and authenticated (`wrangler login`). Check with `wrangler whoami`.

## Deploying Workers

- Deploy: `wrangler deploy`
- Deploy specific script: `wrangler deploy src/index.ts`
- Dry run (validate only): `wrangler deploy --dry-run`
- With source maps: `wrangler deploy --upload-source-maps`
- Keep dashboard-set vars (IMPORTANT — deploy deletes vars not in config by default): `wrangler deploy --keep-vars`
- Deploy with route: `wrangler deploy --route "example.com/*"`
- Attach cron: `wrangler deploy --schedule "*/5 * * * *"`
- Delete a Worker: `wrangler delete`

## Deploying Pages

- Deploy a directory: `wrangler pages deploy ./dist`
- With project name: `wrangler pages deploy ./dist --project-name my-site`
- Local Pages dev: `wrangler pages dev ./public`
- Proxy framework dev server: `wrangler pages dev -- npm run dev`

## Local Development

- Start dev server (local workerd runtime): `wrangler dev`
- Custom port: `wrangler dev --port 8787`
- Test against real production data: `wrangler dev --remote` (careful — live data!)
- Force local only: `wrangler dev --local`
- Test cron triggers: `wrangler dev --test-scheduled` then visit `/__scheduled`
- Inject dev vars: `wrangler dev --var KEY:value`

## Project Setup

- Initialize: `wrangler init my-worker` (use `--yes` to skip prompts)
- Pull existing Worker from dashboard: `wrangler init --from-dash my-worker`
- Generate TypeScript types from config: `wrangler types`

## KV (Key-Value Storage)

- Create namespace: `wrangler kv namespace create MY_KV`
- List namespaces: `wrangler kv namespace list`
- Write key: `wrangler kv key put --namespace-id <id> "key" "value"`
- Read key: `wrangler kv key get --namespace-id <id> "key"`
- Delete key: `wrangler kv key delete --namespace-id <id> "key"`
- Bulk put: `wrangler kv bulk put --namespace-id <id> data.json`

## R2 (Object Storage)

- Create bucket: `wrangler r2 bucket create my-bucket`
- List buckets: `wrangler r2 bucket list`
- Upload: `wrangler r2 object put my-bucket/path/file.txt --file ./local.txt`
- Download: `wrangler r2 object get my-bucket/path/file.txt`
- Delete: `wrangler r2 object delete my-bucket/path/file.txt`

## D1 (SQL Database)

- Create database: `wrangler d1 create my-database`
- List databases: `wrangler d1 list`
- Execute SQL: `wrangler d1 execute my-database --command "SELECT * FROM users"`
- Execute SQL file: `wrangler d1 execute my-database --file schema.sql`
- Local execution: `wrangler d1 execute my-database --local --file seed.sql`
- Remote/production: `wrangler d1 execute my-database --remote --command "SELECT count(*) FROM users"`
- Create migration: `wrangler d1 migrations create my-database "add_users_table"`
- Apply migrations: `wrangler d1 migrations apply my-database` (add `--local` or `--remote`)
- Export: `wrangler d1 export my-database --output backup.sql`

## Secrets

- Add/update (prompts for value): `wrangler secret put MY_SECRET`
- List: `wrangler secret list`
- Delete: `wrangler secret delete MY_SECRET`
- Bulk upload: `wrangler secret bulk secrets.json`
- Secrets persist across deployments (unlike env vars).

## Logs & Tailing

- Stream live logs: `wrangler tail`
- Filter errors: `wrangler tail --status error`
- Filter by method: `wrangler tail --method GET`
- Search: `wrangler tail --search "timeout"`
- JSON output: `wrangler tail --format json`

## Deployments & Rollback

- List deployments: `wrangler deployments list`
- Rollback: `wrangler rollback` or `wrangler rollback <version-id>`
- List versions: `wrangler versions list`

## Key Gotchas

- `wrangler.toml` is central config: name, routes, bindings, compatibility_date, environments.
- Use `-e staging` for environment-specific commands: `wrangler deploy -e staging`.
- Local dev state persists in `.wrangler/state/`. Delete to reset.
- `.dev.vars` file (dotenv format) at project root is loaded automatically during `wrangler dev`. Never commit it.
- D1 defaults to local. Use `--remote` for production.
- `--keep-vars` is critical if you set vars via dashboard — deploy deletes unmanaged vars otherwise.
- For CI/CD: set `CLOUDFLARE_API_TOKEN` env var — Wrangler uses it automatically.
- Pages vs Workers: Pages for full-stack static + functions. Workers for pure scripts.
