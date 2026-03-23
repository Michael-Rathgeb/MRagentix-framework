---
name: gh
description: GitHub CLI — repos, PRs, issues, actions, gists, API calls
---

You are now equipped with GitHub CLI (gh) expertise.

## Prerequisites

Ensure gh is installed (`sudo apt install gh`) and authenticated (`gh auth login`). Check with `gh auth status`. For CI: set `GITHUB_TOKEN` env var.

## Repositories

- Create (interactive): `gh repo create`
- Create public from current dir: `gh repo create myapp --public --source . --push`
- Create private: `gh repo create myapp --private`
- Clone: `gh repo clone owner/repo`
- Shallow clone: `gh repo clone owner/repo -- --depth 1`
- Fork: `gh repo fork owner/repo --clone`
- View in browser: `gh repo view --web`
- List repos: `gh repo list --limit 50 --json name,url`
- Delete: `gh repo delete owner/repo --yes`

## Pull Requests

- Create (interactive): `gh pr create`
- Create with details: `gh pr create --title "Add login" --body "Implements #42"`
- Create draft: `gh pr create --draft`
- Create with reviewers: `gh pr create --title "Fix" --reviewer user1,user2`
- List: `gh pr list` / `gh pr list --author @me` / `gh pr list --label bug`
- View: `gh pr view 123` / `gh pr view 123 --web`
- Checkout locally: `gh pr checkout 123`
- Review: `gh pr review 123 --approve` / `--request-changes --body "msg"` / `--comment --body "msg"`
- Merge: `gh pr merge 123 --squash --delete-branch`
- Check CI status: `gh pr checks 123` / `gh pr checks 123 --watch`
- View diff: `gh pr diff 123`

## Issues

- Create: `gh issue create --title "Bug" --body "Steps..." --label bug --assignee @me`
- List: `gh issue list` / `gh issue list --label enhancement --assignee @me`
- View: `gh issue view 42` / `gh issue view 42 --web`
- Close: `gh issue close 42`
- Comment: `gh issue comment 42 --body "Working on this"`

## GitHub Actions

- List runs: `gh run list --limit 10`
- List for workflow: `gh run list --workflow ci.yml`
- View run: `gh run view <id>` / `gh run view <id> --web`
- Watch run: `gh run watch <id>`
- Re-run failed: `gh run rerun <id> --failed`
- Download artifacts: `gh run download <id>`
- Manually trigger workflow: `gh workflow run deploy.yml --ref main -f environment=staging`
- List workflows: `gh workflow list`

## API Calls

- REST GET: `gh api repos/owner/repo`
- REST POST: `gh api repos/owner/repo/issues --method POST -f title="New" -f body="Details"`
- GraphQL: `gh api graphql -f query='{ viewer { login } }'`
- With jq filtering: `gh api repos/owner/repo --jq '.stargazers_count'`
- Paginate: `gh api repos/owner/repo/issues --paginate`

## Gists

- Create from file: `gh gist create script.sh`
- Create public: `gh gist create --public notes.md`
- List: `gh gist list`

## Extensions

- Install: `gh extension install dlvhdr/gh-dash`
- List installed: `gh extension list`
- Upgrade all: `gh extension upgrade --all`

## JSON Output

Most commands support `--json` for machine-readable output:
- `gh pr list --json number,title,author`
- `gh issue list --json number,title,labels --jq '.[].title'`
- `gh repo view --json name,description,stargazerCount`

## Key Gotchas

- Default auth scopes are minimal. Refresh for more: `gh auth refresh -s repo,read:org,workflow`
- Inside a git repo, gh infers owner/repo from remotes. Override with `--repo owner/repo`.
- Use `GH_PAGER=cat` to disable pager for scripting.
- `gh api` handles auth automatically — use it for any REST/GraphQL endpoint.
- Useful aliases: `gh alias set prc 'pr create --fill'`
- Set secrets: `gh secret set KEY < value.txt` for GitHub Actions secrets.
