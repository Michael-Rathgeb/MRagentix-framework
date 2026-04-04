/**
 * Auto-update from GitHub.
 *
 * On every startup, checks the Git remote for new commits.
 * If the local branch is behind origin, pulls changes and rebuilds.
 * Throttled to once per hour to avoid hammering the network.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve the monorepo root (two levels up from dist/core/) */
function getRepoRoot(): string {
  // From dist/core/auto-update.js → ../../ (package root)
  // Then up two more levels to the monorepo root (past packages/ggcoder/)
  let dir = path.resolve(__dirname, "..", "..");
  // Walk up until we find .git
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return path.resolve(__dirname, "..", "..", "..", "..");
}

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

interface UpdateState {
  lastCheckedAt: number;
}

function getStateFilePath(): string {
  return path.join(os.homedir(), ".mragentix", "update-state.json");
}

function readState(): UpdateState | null {
  try {
    return JSON.parse(fs.readFileSync(getStateFilePath(), "utf-8")) as UpdateState;
  } catch {
    return null;
  }
}

function writeState(state: UpdateState): void {
  const dir = path.dirname(getStateFilePath());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getStateFilePath(), JSON.stringify(state));
}

function run(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, timeout: 30_000, stdio: "pipe", encoding: "utf-8" }).trim();
}

/**
 * Check GitHub for updates. If behind, pull and rebuild.
 * Returns a user-facing message if something happened, or null if up-to-date.
 */
export function checkAndAutoUpdate(_currentVersion: string): string | null {
  try {
    // Throttle: skip if checked recently
    const state = readState();
    if (state && Date.now() - state.lastCheckedAt < CHECK_INTERVAL_MS) {
      return null;
    }

    const repoRoot = getRepoRoot();

    // Verify this is a git repo
    if (!fs.existsSync(path.join(repoRoot, ".git"))) {
      return null;
    }

    // Fetch latest from origin (fast, network-only)
    run("git fetch origin --quiet", repoRoot);

    // Check if local branch is behind remote
    const branch = run("git rev-parse --abbrev-ref HEAD", repoRoot);
    const localHead = run("git rev-parse HEAD", repoRoot);
    const remoteHead = run(`git rev-parse origin/${branch}`, repoRoot);

    // Save check timestamp regardless of outcome
    writeState({ lastCheckedAt: Date.now() });

    if (localHead === remoteHead) {
      return null; // Already up-to-date
    }

    // Check if we're behind (not ahead — don't pull if we have local commits to push)
    const behindCount = run(
      `git rev-list --count HEAD..origin/${branch}`,
      repoRoot,
    );

    if (behindCount === "0") {
      return null; // We're ahead or at the same point
    }

    // Check for uncommitted changes that would block pull
    const status = run("git status --porcelain", repoRoot);
    if (status) {
      return `⚡ ${behindCount} update(s) available but you have uncommitted changes. Run: cd ${repoRoot} && git stash && git pull && pnpm build`;
    }

    // Pull changes
    run(`git pull origin ${branch} --ff-only --quiet`, repoRoot);

    // Rebuild all packages
    run("pnpm build", repoRoot);

    // Get short summary of what changed
    const shortlog = run(
      `git log --oneline ${localHead}..HEAD --no-decorate`,
      repoRoot,
    );
    const commitCount = shortlog.split("\n").filter(Boolean).length;

    return `⚡ Auto-updated from GitHub (${commitCount} new commit${commitCount === 1 ? "" : "s"}). Restart to pick up CLI changes.`;
  } catch {
    // Never crash the CLI because of an update check failure
    return null;
  }
}
