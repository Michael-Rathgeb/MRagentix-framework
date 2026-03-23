---
name: act
description: Run GitHub Actions workflows locally in Docker containers
---

You are now equipped with act CLI expertise for running GitHub Actions locally.

## Prerequisites

Ensure act is installed and Docker is running. Docker is required — act runs each job in a Docker container.

## Running Workflows

- Run all workflows (push event): `act`
- Run specific event: `act push` / `act pull_request` / `act workflow_dispatch`
- Run specific job: `act -j build` / `act -j test`
- Run specific workflow file: `act -W .github/workflows/ci.yml`
- List all workflows/jobs (dry run): `act -l`
- Dry run (show what would run): `act -n`
- Verbose output: `act -v`

## Secrets & Environment

- Pass secret inline: `act -s MY_SECRET=value`
- Multiple secrets: `act -s AWS_KEY=xxx -s AWS_SECRET=yyy`
- Secrets from file: `act --secret-file .secrets`
- Env vars from file: `act --env-file .env`
- GitHub token (needed by most actions): `act -s GITHUB_TOKEN=$(gh auth token)`
- Workflow dispatch inputs: `act workflow_dispatch --input name=value`

## Runner Images

First run prompts for image selection:
- **Micro** (~200MB): `node:16-buster-slim` — simple Node.js workflows
- **Medium** (~500MB): `catthehacker/ubuntu:act-latest` — most workflows (recommended)
- **Large** (~12GB): `catthehacker/ubuntu:full-latest` — complex workflows needing many tools

Override image: `act -P ubuntu-latest=catthehacker/ubuntu:act-latest`

## Performance

- Reuse containers between runs: `act --reuse`
- First run is slow (pulls Docker image). Subsequent runs use cached image.
- Clean up manually after using `--reuse`.

## Configuration

Store defaults in `.actrc` (repo root) or `~/.actrc`:
```
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--secret-file .secrets
--env-file .env
```

## Key Gotchas

- Docker MUST be running before using act.
- Start with Medium image. Only use Large if Medium is missing tools.
- `actions/cache` is NOT supported by default.
- Service containers (`services:`) have limited support.
- `GITHUB_TOKEN` must be supplied manually: `-s GITHUB_TOKEN=$(gh auth token)`
- Artifacts go to `/tmp/artifacts` locally.
- act doesn't perfectly replicate GitHub-hosted runners. Always verify on real runners before merging.
- For Docker-in-Docker workflows: use `--bind` flag.
- Load secrets from Doppler: `doppler secrets download --no-file --format env > .secrets && act --secret-file .secrets`
