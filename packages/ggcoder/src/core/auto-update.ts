/**
 * Auto-update module.
 *
 * Auto-update is DISABLED — we run from local source and do not want
 * to pull updates from the upstream npm package (@kenkaiiii/ggcoder).
 *
 * The original implementation checked the npm registry every 4 hours
 * and silently ran `pnpm add -g @kenkaiiii/ggcoder@latest` (or npm/yarn
 * equivalent). That behaviour is now short-circuited.
 */

/**
 * Previously: check for updates and silently auto-update if a newer
 * version was available on npm.  Now: no-op.
 */
export function checkAndAutoUpdate(_currentVersion: string): string | null {
  return null;
}
