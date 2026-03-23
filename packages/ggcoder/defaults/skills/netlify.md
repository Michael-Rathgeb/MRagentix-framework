---
name: netlify
description: Deploy to Netlify — functions, forms, edge, preview URLs
---

You are now equipped with Netlify CLI expertise. Use this knowledge to deploy and manage Netlify projects.

## Prerequisites

Ensure Netlify CLI is installed (`npm i -g netlify-cli`) and authenticated (`netlify login`). Check with `netlify status`.

## Deploying

- For a **draft/preview deployment**: `netlify deploy` — creates a unique preview URL.
- For **production**: `netlify deploy --prod`
- Deploy a specific directory (skip build): `netlify deploy --dir build --no-build`
- Deploy with functions: `netlify deploy --functions my-functions`
- Add a deploy message: `netlify deploy --message "Release v1.2.3"`
- Deploy and open in browser: `netlify deploy --prod --open`
- Trigger remote build without uploading: `netlify deploy --trigger`
- For CI: `netlify deploy --prod --auth $NETLIFY_AUTH_TOKEN --site $NETLIFY_SITE_ID`

## Project Setup

- Initialize continuous deployment: `netlify init`
- Link to existing project: `netlify link`
- Unlink: `netlify unlink`
- Start local dev server: `netlify dev` (auto-detects framework)
- Dev with custom command: `netlify dev -c "hugo server -w" --target-port 1313`
- Public live session with tunnel URL: `netlify dev --live`
- Build locally like Netlify: `netlify build`

## Functions

- Create a function from template: `netlify functions:create --name my-function`
- List functions: `netlify functions:list`
- Test locally during dev: `netlify functions:invoke my-function --payload '{"key":"value"}'`
- Build functions: `netlify functions:build`

## Environment Variables

- List all: `netlify env:list`
- Get: `netlify env:get MY_VAR`
- Set: `netlify env:set MY_VAR "value"`
- Remove: `netlify env:unset MY_VAR`
- Import from file: `netlify env:import .env`
- Clone to another project: `netlify env:clone --to <target-id>`

## Logs

- Deploy build logs: `netlify logs:deploy`
- Function logs: `netlify logs:function` or `netlify logs:function my-function`

## Sites

- Create: `netlify sites:create --name my-site`
- List: `netlify sites:list`
- Open dashboard: `netlify open` / `netlify open:admin`
- Watch deploy finish: `netlify watch`

## Key Gotchas

- `netlify deploy` = draft. `netlify deploy --prod` = production. Drafts are great for QA.
- Functions directory defaults to `netlify/functions/`. Override in `netlify.toml` or with `--functions`.
- Edge Functions live in `netlify/edge-functions/` (Deno-based). Debug with `netlify dev --edge-inspect`.
- `netlify.toml` is the primary config: build commands, redirects, headers, plugins.
- Context-aware env vars: use `--context production|deploy-preview|branch-deploy|dev`.
- `netlify serve` builds for production and serves locally (unlike `netlify dev`, no watch).
- Monorepo: use `--filter <app>` on most commands.
