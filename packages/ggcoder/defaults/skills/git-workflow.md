---
name: git-workflow
description: Git — branching strategies, rebasing, conflict resolution, conventional commits, and release workflows
---

# Git Workflow

Comprehensive reference for Git operations, branching strategies, and team workflow patterns.

---

## 1. Configuration

```bash
# Identity
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Defaults
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global push.autoSetupRemote true
git config --global rerere.enabled true      # Remember resolved conflicts
git config --global fetch.prune true         # Auto-prune deleted remote branches

# Aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all --decorate"
```

---

## 2. Conventional Commits

Format: `<type>(<scope>): <description>`

### Types
- `feat` — new feature (bumps minor version)
- `fix` — bug fix (bumps patch version)
- `docs` — documentation only
- `style` — formatting, no logic change
- `refactor` — code restructure, no behavior change
- `perf` — performance improvement
- `test` — adding/updating tests
- `build` — build system or dependencies
- `ci` — CI configuration
- `chore` — maintenance, no production code change

### Examples

```
feat(auth): add OAuth PKCE flow for Anthropic
fix(tools): handle empty file in read tool
docs: update README with installation guide
refactor(agent): extract message formatting to separate module
feat!: drop Node.js 18 support

BREAKING CHANGE: Minimum Node.js version is now 20.
```

### Rules
- Subject line: imperative mood, lowercase, no period, max 72 chars
- Body: wrap at 72 chars, explain what and why (not how)
- Footer: `BREAKING CHANGE:` for breaking changes, `Fixes #123` for issue refs

---

## 3. Branching Strategies

### GitHub Flow (Recommended for most projects)
1. `main` is always deployable
2. Create feature branches from `main`: `git checkout -b feat/add-login`
3. Commit frequently, push to remote
4. Open PR, get reviews, CI passes
5. Merge to `main` (squash or merge commit)
6. Deploy from `main`

### Git Flow (For versioned releases)
- `main` — production releases (tagged)
- `develop` — integration branch
- `feature/*` — branch from `develop`
- `release/*` — branch from `develop` for release prep
- `hotfix/*` — branch from `main` for urgent fixes

### Trunk-Based Development
- Everyone commits to `main` (or very short-lived branches)
- Feature flags instead of long-lived branches
- CI/CD deploys every merge to `main`

---

## 4. Common Operations

### Branching

```bash
# Create and switch
git checkout -b feat/new-feature
# or
git switch -c feat/new-feature

# List branches
git branch -a          # all (local + remote)
git branch --merged    # branches merged into current

# Delete branch
git branch -d feat/old-feature           # local (safe — only if merged)
git branch -D feat/old-feature           # local (force)
git push origin --delete feat/old-feature # remote
```

### Staging & Committing

```bash
git add -A                    # stage everything
git add -p                    # interactive staging (patch mode)
git commit -m "feat: add X"
git commit --amend            # edit last commit (message or content)
git commit --amend --no-edit  # add staged changes to last commit silently
```

### Stashing

```bash
git stash                     # stash working changes
git stash -m "WIP: login"    # with message
git stash list                # see all stashes
git stash pop                 # apply and remove latest
git stash apply stash@{2}    # apply specific stash (keep in list)
git stash drop stash@{0}     # remove specific stash
```

### Viewing History

```bash
git log --oneline -20                    # last 20 commits, compact
git log --oneline --graph --all          # visual branch graph
git log --author="Name" --since="2024-01-01"
git log -- path/to/file                  # history of specific file
git diff main..feat/branch               # diff between branches
git diff --staged                        # diff of staged changes
git show abc1234                         # show specific commit
git blame path/to/file                   # line-by-line authorship
```

---

## 5. Rebasing

### Interactive Rebase

```bash
# Rebase last 5 commits (squash, reorder, edit, drop)
git rebase -i HEAD~5

# Rebase feature branch onto latest main
git checkout feat/my-feature
git rebase main
```

### Rebase Commands (in interactive editor)
- `pick` — keep commit as-is
- `squash` / `s` — merge into previous commit (combine messages)
- `fixup` / `f` — merge into previous commit (discard message)
- `reword` / `r` — keep commit but edit message
- `edit` / `e` — pause to amend the commit
- `drop` / `d` — delete the commit

### Rebase vs Merge
- **Rebase**: clean linear history, use for feature branches before merging
- **Merge**: preserves branch history, use for integrating to main
- **Rule**: Never rebase commits that have been pushed and shared

### Recovering from Bad Rebase

```bash
git reflog                    # find the commit before rebase
git reset --hard HEAD@{3}    # reset to that point
```

---

## 6. Conflict Resolution

```bash
# During merge/rebase with conflicts:
git status                    # see conflicted files

# Edit files — resolve conflict markers:
# <<<<<<< HEAD
# your changes
# =======
# their changes
# >>>>>>> branch-name

git add resolved-file.ts      # mark as resolved
git rebase --continue         # continue rebase
# or
git merge --continue          # continue merge

# Abort if needed
git rebase --abort
git merge --abort
```

### Tips
- Use `git rerere` (reuse recorded resolution) — auto-applies previous conflict resolutions
- Use `git checkout --theirs file` or `--ours file` to accept one side entirely
- For complex conflicts, use `git mergetool` with a visual diff tool

---

## 7. Undoing Changes

```bash
# Unstage a file
git restore --staged file.ts

# Discard working directory changes
git restore file.ts

# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Undo last commit (keep changes unstaged)
git reset HEAD~1

# Undo last commit (discard changes entirely)
git reset --hard HEAD~1

# Revert a specific commit (creates new commit)
git revert abc1234

# Revert a merge commit
git revert -m 1 abc1234
```

---

## 8. Tags & Releases

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release 1.0.0"

# Create tag at specific commit
git tag -a v1.0.0 abc1234 -m "Release 1.0.0"

# Push tags
git push origin v1.0.0        # single tag
git push origin --tags         # all tags

# List tags
git tag -l "v1.*"

# Delete tag
git tag -d v1.0.0              # local
git push origin :refs/tags/v1.0.0  # remote
```

### Semantic Versioning
- `MAJOR.MINOR.PATCH` — e.g., `1.2.3`
- MAJOR: breaking changes
- MINOR: new features (backward compatible)
- PATCH: bug fixes (backward compatible)

---

## 9. Working with Remotes

```bash
# Add remote
git remote add origin https://github.com/user/repo.git
git remote add upstream https://github.com/original/repo.git

# Fetch & pull
git fetch origin                    # download without merging
git pull origin main --rebase       # fetch + rebase
git pull upstream main              # sync fork with upstream

# Push
git push origin feat/my-branch
git push -u origin feat/my-branch   # set upstream tracking

# Sync fork
git fetch upstream
git rebase upstream/main
git push origin main
```

---

## 10. Cherry-Pick

```bash
# Apply specific commit to current branch
git cherry-pick abc1234

# Cherry-pick without committing (stage only)
git cherry-pick --no-commit abc1234

# Cherry-pick a range
git cherry-pick abc1234..def5678
```

---

## 11. Worktrees

Work on multiple branches simultaneously without stashing:

```bash
# Create a worktree for a branch
git worktree add ../project-hotfix hotfix/urgent-fix

# List worktrees
git worktree list

# Remove worktree
git worktree remove ../project-hotfix
```

---

## 12. Bisect (Find Bug-Introducing Commit)

```bash
git bisect start
git bisect bad                # current commit is broken
git bisect good v1.0.0        # this tag was working

# Git checks out middle commit — test it, then:
git bisect good   # or
git bisect bad

# Repeat until the bad commit is found
git bisect reset              # return to original branch
```

---

## 13. .gitignore Patterns

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build output
dist/
.next/
out/

# Environment
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Coverage
coverage/
```

### Remove already-tracked files

```bash
# Remove from tracking but keep on disk
git rm --cached .env
git rm -r --cached node_modules

# Then commit the .gitignore update
git add .gitignore
git commit -m "chore: update gitignore, remove tracked files"
```

---

## Key Gotchas

- **Never force push to shared branches** (`main`, `develop`) without team agreement
- **`git pull` defaults matter** — set `pull.rebase true` to avoid merge bubbles
- **Commit often, push often** — small commits are easier to review, revert, and bisect
- **Write meaningful commit messages** — your future self (and teammates) will thank you
- **Don't commit secrets** — use `.env` files + `.gitignore`, rotate if leaked
- **`git reflog` is your safety net** — it tracks all HEAD movements for ~30 days
