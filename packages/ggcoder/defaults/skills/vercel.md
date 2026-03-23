---
name: vercel
description: Deploy projects to Vercel — preview URLs, prod deploys, env vars, domains
---

You are now equipped with Vercel CLI expertise. Use this knowledge to help with Vercel deployments and management.

## Prerequisites

Ensure Vercel CLI is installed (`npm i -g vercel`) and authenticated (`vercel login`). Check with `vercel whoami`.

## Deploying

- For a **preview deployment**, run `vercel` in the project directory. This creates a unique preview URL.
- For a **production deployment**, run `vercel --prod`. Always verify the output URL responds with HTTP 200 before reporting success.
- To deploy a specific directory: `vercel /path/to/project`
- To build locally first (faster CI): run `vercel build` then `vercel deploy --prebuilt`
- Add deploy metadata with: `vercel deploy -m "release=v1.2.3"`
- For CI/CD, use: `vercel --prod --yes --token $VERCEL_TOKEN`

## Project Setup

- Link to an existing project: `vercel link`
- Pull project settings and env vars locally: `vercel pull` (creates `.vercel/` and `.env.local`)
- Start local dev server: `vercel dev` (default port 3000)
- Custom port: `vercel dev --listen 8080`

## Environment Variables

- Pull env vars to `.env.local`: `vercel env pull`
- Pull to a custom file: `vercel env pull .env.production`
- List all: `vercel env list`
- Add: `vercel env add MY_KEY`
- Add to specific environment: `vercel env add MY_KEY production main`
- Remove: `vercel env remove MY_KEY`
- Run command with project env vars: `vercel env run -- npm test`
- Note: `vercel pull` downloads BOTH settings and env vars. `vercel env pull` downloads ONLY env vars.

## Domains & Aliases

- List domains: `vercel domains`
- Add domain: `vercel domains add example.com my-project`
- Set alias: `vercel alias set <deployment-url> custom.example.com`
- List aliases: `vercel alias list`

## Logs & Inspection

- Stream live logs: `vercel logs`
- Filter by error level: `vercel logs --level error --since 1h`
- Filter by status: `vercel logs --status-code 500 --json`
- Inspect deployment: `vercel inspect <deployment-url>`

## Deployment Management

- List deployments: `vercel list`
- Promote to production: `vercel promote <deployment-url>`
- Rollback: `vercel rollback <deployment-url>`
- Remove: `vercel rm <deployment-id>`

## Teams

- Switch team: `vercel switch` or `vercel switch my-team`
- Scope any command: `vercel --scope my-team list`

## Key Gotchas

- Framework detection is automatic (Next.js, Vite, Remix, SvelteKit, Astro). Override with `vercel.json` if wrong.
- Every deploy without `--prod` creates a preview. Only `--prod` goes to production domain.
- `.vercel/` directory is commit-safe but usually `.gitignore`'d.
- `--force` resets build cache. Use `--force --with-cache` to keep cache.
- Monorepos: use root directory setting or `--cwd` for sub-packages.
- Global flags: `-d` (debug), `-S <scope>` (team), `-t <token>` (auth), `--cwd` (working directory).
