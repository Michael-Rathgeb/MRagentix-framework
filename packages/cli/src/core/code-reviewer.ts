import { stream, type Provider } from "@mragentix/ai";
import { log } from "./logger.js";

// ── Types ──────────────────────────────────────────────────

export type ReviewMode = "standard" | "adversarial";

export interface ReviewFinding {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  body: string;
  file: string;
  lineStart?: number;
  lineEnd?: number;
  confidence: number;
  recommendation: string;
}

export interface ReviewResult {
  verdict: "approve" | "needs-attention";
  findings: ReviewFinding[];
  summary: string;
  nextSteps: string[];
  reviewModel: string;
  mode: ReviewMode;
  tokenUsage: { input: number; output: number };
}

// ── Review Prompts ─────────────────────────────────────────

const STANDARD_REVIEW_PROMPT = `You are a code reviewer. Review the provided code changes for material issues only.

Focus on:
1. Bugs, logic errors, and correctness issues
2. Security vulnerabilities (auth, injection, data exposure)
3. Unhandled edge cases (null, empty, timeout, error paths)
4. Race conditions, concurrency, and state management issues

Do NOT comment on:
- Code style, formatting, or naming
- Architecture opinions or refactoring suggestions
- Minor improvements that don't affect correctness

Respond in JSON format matching this exact schema:
{
  "verdict": "approve" | "needs-attention",
  "summary": "Brief ship/no-ship assessment",
  "findings": [{
    "severity": "critical" | "high" | "medium" | "low",
    "title": "Short label for the issue",
    "body": "Detailed explanation of what can go wrong and why",
    "file": "path/to/file.ts",
    "line_start": 42,
    "line_end": 50,
    "confidence": 0.9,
    "recommendation": "Concrete fix suggestion"
  }],
  "next_steps": ["Actionable follow-up item"]
}

Rules:
- Use "approve" if no material issues found. Return empty findings array.
- Use "needs-attention" if any finding is high or critical severity.
- Every finding must reference a specific file and be defensible from the diff.
- Prefer one strong finding over several weak ones.
- Confidence is 0-1. Be honest — if you're inferring, keep confidence below 0.7.
- If the changes look safe, say so directly.`;

const ADVERSARIAL_REVIEW_PROMPT = `You are performing an adversarial software review.
Your job is to break confidence in the change, not to validate it.

Default to skepticism. Assume the change can fail in subtle, high-cost, or user-visible ways until the evidence says otherwise.
Do not give credit for good intent, partial fixes, or likely follow-up work.
If something only works on the happy path, treat that as a real weakness.

Prioritize the kinds of failures that are expensive, dangerous, or hard to detect:
- Auth, permissions, tenant isolation, and trust boundaries
- Data loss, corruption, duplication, and irreversible state changes
- Rollback safety, retries, partial failure, and idempotency gaps
- Race conditions, ordering assumptions, stale state, and re-entrancy
- Empty-state, null, timeout, and degraded dependency behavior
- Version skew, schema drift, migration hazards, and compatibility regressions
- Observability gaps that would hide failure or make recovery harder

Actively try to disprove the change. Look for violated invariants, missing guards, unhandled failure paths, and assumptions that stop being true under stress.
Trace how bad inputs, retries, concurrent actions, or partially completed operations move through the code.

Report only material findings. Each finding must answer:
1. What can go wrong?
2. Why is this code path vulnerable?
3. What is the likely impact?
4. What concrete change would reduce the risk?

Respond in JSON format matching this exact schema:
{
  "verdict": "approve" | "needs-attention",
  "summary": "Terse ship/no-ship assessment — not a neutral recap",
  "findings": [{
    "severity": "critical" | "high" | "medium" | "low",
    "title": "Short label for the issue",
    "body": "Detailed explanation — adversarial, not stylistic",
    "file": "path/to/file.ts",
    "line_start": 42,
    "line_end": 50,
    "confidence": 0.9,
    "recommendation": "Concrete fix suggestion"
  }],
  "next_steps": ["Actionable follow-up item"]
}

Rules:
- Every finding must be adversarial rather than stylistic.
- Every finding must be tied to a concrete code location and plausible under a real failure scenario.
- Do not invent files, lines, code paths, or runtime behavior you cannot support from the diff.
- If a conclusion depends on an inference, state that explicitly and keep confidence honest.
- Prefer one strong finding over several weak ones. Do not dilute serious issues with filler.
- If the change looks safe, say so directly and return no findings with verdict "approve".
- Be aggressive, but stay grounded.`;

// ── Git Diff Collector ─────────────────────────────────────

/**
 * Collect the git diff of uncommitted changes in the working directory.
 * Returns null if git is not available or there are no changes.
 */
export async function collectGitDiff(cwd: string): Promise<string | null> {
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);

    // Get both staged and unstaged changes
    const [staged, unstaged] = await Promise.all([
      execFileAsync("git", ["diff", "--cached", "--no-color"], { cwd, maxBuffer: 1024 * 1024 }).catch(() => ({ stdout: "" })),
      execFileAsync("git", ["diff", "--no-color"], { cwd, maxBuffer: 1024 * 1024 }).catch(() => ({ stdout: "" })),
    ]);

    const diff = [staged.stdout, unstaged.stdout].filter(Boolean).join("\n");
    if (!diff.trim()) return null;

    // Truncate very large diffs to avoid blowing up review context
    if (diff.length > 50_000) {
      return diff.slice(0, 50_000) + "\n\n... (diff truncated at 50KB)";
    }

    return diff;
  } catch {
    return null;
  }
}

/**
 * Collect git diff relative to a base branch (e.g. main).
 */
export async function collectBranchDiff(cwd: string, baseRef: string): Promise<string | null> {
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);

    const result = await execFileAsync("git", ["diff", `${baseRef}...HEAD`, "--no-color"], {
      cwd,
      maxBuffer: 2 * 1024 * 1024,
    });

    const diff = result.stdout.trim();
    if (!diff) return null;

    if (diff.length > 50_000) {
      return diff.slice(0, 50_000) + "\n\n... (diff truncated at 50KB)";
    }

    return diff;
  } catch {
    return null;
  }
}

// ── Core Review Function ───────────────────────────────────

export async function reviewCode(options: {
  diff: string;
  provider: Provider;
  model: string;
  apiKey: string;
  mode?: ReviewMode;
  signal?: AbortSignal;
}): Promise<ReviewResult | null> {
  const { diff, provider, model, apiKey, mode = "standard", signal } = options;

  if (!diff.trim()) return null;

  const systemPrompt = mode === "adversarial" ? ADVERSARIAL_REVIEW_PROMPT : STANDARD_REVIEW_PROMPT;
  const userMessage = `## Code Changes\n\n\`\`\`diff\n${diff}\n\`\`\``;

  try {
    const result = stream({
      provider,
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      maxTokens: 8192,
      apiKey,
      signal,
    });

    let responseText = "";
    for await (const event of result) {
      if (event.type === "text_delta") {
        responseText += event.text;
      }
    }

    const response = await result.response;
    const usage = response.usage;

    const parsed = parseReviewResponse(responseText);
    if (!parsed) {
      log("WARN", "review", "Failed to parse review response as JSON, treating as plain summary");
      return {
        verdict: "approve",
        findings: [],
        summary: responseText.slice(0, 500),
        nextSteps: [],
        reviewModel: model,
        mode,
        tokenUsage: { input: usage.inputTokens, output: usage.outputTokens },
      };
    }

    return {
      verdict: normalizeVerdict(parsed.verdict),
      findings: normalizeFindings(parsed.findings ?? []),
      summary: parsed.summary ?? "No issues found",
      nextSteps: parsed.next_steps ?? [],
      reviewModel: model,
      mode,
      tokenUsage: { input: usage.inputTokens, output: usage.outputTokens },
    };
  } catch (err) {
    log("ERROR", "review", `Code review failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// ── Helpers ────────────────────────────────────────────────

interface RawReviewResponse {
  verdict?: string;
  findings?: RawFinding[];
  summary?: string;
  next_steps?: string[];
}

interface RawFinding {
  severity?: string;
  title?: string;
  body?: string;
  description?: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  lineStart?: number;
  lineEnd?: number;
  confidence?: number;
  recommendation?: string;
}

function normalizeFindings(raw: RawFinding[]): ReviewFinding[] {
  return raw.map((f) => ({
    severity: normalizeSeverity(f.severity),
    title: f.title ?? "Untitled finding",
    body: f.body ?? f.description ?? "",
    file: f.file ?? "unknown",
    lineStart: f.line_start ?? f.lineStart,
    lineEnd: f.line_end ?? f.lineEnd,
    confidence: typeof f.confidence === "number" ? Math.min(1, Math.max(0, f.confidence)) : 0.5,
    recommendation: f.recommendation ?? "",
  }));
}

function normalizeVerdict(v?: string): ReviewResult["verdict"] {
  if (v === "needs-attention") return "needs-attention";
  if (v === "approve") return "approve";
  return "approve";
}

function normalizeSeverity(s?: string): ReviewFinding["severity"] {
  switch (s?.toLowerCase()) {
    case "critical": return "critical";
    case "high": return "high";
    case "medium": return "medium";
    case "low": return "low";
    // Map old severity names for backwards compat
    case "bug": return "high";
    case "security": return "critical";
    case "edge-case": return "medium";
    case "correctness": return "high";
    default: return "medium";
  }
}

function parseReviewResponse(text: string): RawReviewResponse | null {
  // Try direct JSON parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code fences
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch?.[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Fall through
      }
    }

    // Try finding JSON object in the text
    const braceStart = text.indexOf("{");
    const braceEnd = text.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd > braceStart) {
      try {
        return JSON.parse(text.slice(braceStart, braceEnd + 1));
      } catch {
        // Fall through
      }
    }

    return null;
  }
}
