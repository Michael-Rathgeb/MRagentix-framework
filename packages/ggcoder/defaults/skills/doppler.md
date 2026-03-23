---
name: doppler
description: Doppler — secrets management, env var injection, config sync
---

You are now equipped with Doppler CLI expertise for secrets management.

## Prerequisites

Ensure Doppler CLI is installed and authenticated (`doppler login`). Check with `doppler me`.

## Project Setup

- Login: `doppler login`
- Configure project in current directory: `doppler setup` (interactive — selects project + config)
- This creates `.doppler.yaml` (add to `.gitignore`)
- Check context: `doppler me`

## Running with Secrets (Primary Usage)

The main way to use Doppler — inject secrets as env vars into any command:

- `doppler run -- npm start`
- `doppler run -- node server.js`
- `doppler run -- docker compose up`
- `doppler run -- python app.py`
- Override project/config: `doppler run --project myapp --config dev -- npm start`
- With CI token: `doppler run --token dp.st.xxx -- npm start`

No `.env` file needed — every secret becomes an environment variable.

## Secrets Management

- List all: `doppler secrets`
- List names only: `doppler secrets --only-names`
- Get specific: `doppler secrets get DATABASE_URL`
- Get raw value: `doppler secrets get DATABASE_URL --plain`
- Set: `doppler secrets set API_KEY=sk_live_xxx`
- Set multiple: `doppler secrets set KEY1=value1 KEY2=value2`
- Delete: `doppler secrets delete OLD_KEY`

## Import & Export

- Import from .env file: `doppler secrets upload .env`
- Export as env format: `doppler secrets download --no-file --format env`
- Export as JSON: `doppler secrets download --no-file --format json`
- Export for Docker: `doppler secrets download --no-file --format docker`
- Write to .env file: `doppler secrets download --no-file --format env > .env`
- Export to shell: `eval $(doppler secrets download --no-file --format env-no-quotes)`

## Environments & Configs

- List environments: `doppler environments`
- List configs: `doppler configs`
- Create branch config: `doppler configs create --environment dev --name dev_michael`
- Lock config: `doppler configs lock --config prd`

## Projects

- List: `doppler projects`
- Create: `doppler projects create myapp`

## Service Tokens (CI/CD)

- Create token: `doppler configs tokens create --config prd --name "CI Token"`
- List tokens: `doppler configs tokens`
- Revoke: `doppler configs tokens revoke <slug>`

For CI/production, always use scoped service tokens instead of personal auth.

## Fallback Files

For resilience against outages:
```bash
doppler secrets download --format json --no-file > .doppler-fallback.json
doppler run --fallback .doppler-fallback.json -- npm start
```
Encrypt or `.gitignore` fallback files — they contain real secrets.

## Key Gotchas

- Most commands need project/config context from `doppler setup`. Without it, pass `--project` and `--config`.
- `.doppler.yaml` is developer-specific — add to `.gitignore`.
- Config hierarchy: root → environment (dev/stg/prd) → branch config (dev_michael).
- Secret referencing: use `${DATABASE_HOST}` inside secret values for DRY configs.
- All changes are audit-logged in the Dashboard.
- Integration pattern with Vercel: `doppler secrets download --format env --no-file | vercel env add`
- Integration with Docker: `doppler run -- docker compose up`
- Integration with act: `doppler secrets download --no-file --format env > .secrets && act --secret-file .secrets`
