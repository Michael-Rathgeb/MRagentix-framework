---
name: railway
description: Railway — deploy apps, manage services, env vars, logs, databases
---

You are now equipped with Railway CLI expertise.

## Prerequisites

Ensure Railway CLI is installed (`npm i -g @railway/cli` or `brew install railway`) and authenticated (`railway login`). Check with `railway whoami`.

## Project Setup

- Create new project: `railway init`
- Link to existing project: `railway link`
- Link specific project/environment: `railway link --project <id> --environment <env-name>`
- Check current context: `railway status`

## Deploying

- Deploy current directory: `railway up`
- Deploy with Dockerfile: `railway up --dockerfile ./Dockerfile`
- Deploy and detach: `railway up --detach`
- Redeploy: `railway redeploy`
- Redeploy with no cache: `railway redeploy --no-cache`

Railway auto-detects the build system using Nixpacks (Node.js, Python, Go, Rust, Java, Ruby, PHP). If a Dockerfile exists, it takes priority over Nixpacks.

## Environment Variables

- List all: `railway variables`
- Set: `railway variables set KEY=value`
- Set multiple: `railway variables set KEY1=value1 KEY2=value2`
- Delete: `railway variables delete KEY`
- Open in browser: `railway open`

## Logs

- Stream live logs: `railway logs`
- Follow in real time: `railway logs --follow`
- Deployment logs: `railway logs --deployment`

## Services & Commands

- List services: `railway service`
- Add service/database: `railway add`
- Open shell with env vars: `railway shell`
- Run command with Railway env vars injected: `railway run <command>`
- Example — run migrations: `railway run npx prisma migrate deploy`
- Example — open Prisma Studio: `railway run npx prisma studio`

`railway run` is extremely useful — it injects all Railway env vars into your local command without copying connection strings.

## Domains & Volumes

- Generate railway.app domain: `railway domain`
- Add persistent volume: `railway volume`
- List volumes: `railway volume --list`
- Custom domains are configured via the dashboard.

## Key Gotchas

- Every command operates against current linked project/environment. Check with `railway status`.
- Dockerfile takes priority over Nixpacks. Remove Dockerfile to force Nixpacks.
- Multiple environments supported (production, staging). Switch with `railway link --environment <name>`.
- Services communicate internally via `<service>.railway.internal` DNS.
- For CI: use `railway login --browserless` with `RAILWAY_TOKEN`.
- Monorepo: set `RAILWAY_ROOT_DIRECTORY` for each service.
- If start command isn't detected, set `RAILWAY_START_COMMAND` variable.
