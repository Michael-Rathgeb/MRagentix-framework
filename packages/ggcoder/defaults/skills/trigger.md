---
name: trigger
description: Trigger.dev — durable background tasks, AI agent workflows, cron schedules, queues, retries, and realtime streaming
---

You are now equipped with Trigger.dev expertise. Use this to build durable background tasks, AI agent workflows, scheduled jobs, and automation pipelines.

## Prerequisites

Ensure `@trigger.dev/sdk` is installed and the CLI is available. Check with `npx trigger.dev@latest --version`. You need a Trigger.dev account (cloud at https://cloud.trigger.dev or self-hosted).

## Project Setup

- Initialize in existing project: `npx trigger.dev@latest init`
- Start dev server: `npx trigger.dev@latest dev`
- Deploy to cloud: `npx trigger.dev@latest deploy`
- Login: `npx trigger.dev@latest login`
- Check auth: `npx trigger.dev@latest whoami`
- Update packages: `npx trigger.dev@latest update`

Set `TRIGGER_SECRET_KEY` in `.env` (find it on the API Keys page in the dashboard).

## Config File (`trigger.config.ts`)

```ts
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "<project-ref>",       // from dashboard Project Settings
  dirs: ["./trigger"],             // where task files live
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});
```

## Defining Tasks

Tasks go in the `trigger/` directory. Each task must have a unique `id` and a `run` function.

```ts
import { task } from "@trigger.dev/sdk";

export const myTask = task({
  id: "my-task",
  run: async (payload: { message: string }) => {
    // Long-running code — no timeouts
    return { result: "done" };
  },
});
```

### Task Options

```ts
export const resilientTask = task({
  id: "resilient-task",
  retry: { maxAttempts: 5, factor: 1.8, minTimeoutInMs: 500 },
  queue: { concurrencyLimit: 1 },              // one-at-a-time
  machine: { preset: "large-1x" },             // 4 vCPU, 8 GB RAM
  maxDuration: 300,                             // 5 min timeout
  run: async (payload) => { /* ... */ },
});
```

Machine presets: `micro`, `small-1x`, `small-2x`, `medium-1x`, `medium-2x`, `large-1x`, `large-2x`.

## Triggering Tasks

### From backend code (type-safe)

```ts
import { tasks } from "@trigger.dev/sdk";
import type { myTask } from "~/trigger/my-task";  // type-only import!

const handle = await tasks.trigger<typeof myTask>("my-task", { message: "hello" });
```

### With options (delay, idempotency)

```ts
const handle = await tasks.trigger<typeof myTask>("my-task", payload, {
  delay: "1h",                    // run after 1 hour
  idempotencyKey: "unique-key",   // prevent duplicates
  ttl: "1d",                      // expire if not started within 1 day
});
```

### Batch trigger

```ts
const batchHandle = await tasks.batchTrigger<typeof myTask>(
  "my-task",
  items.map((item) => ({ payload: item }))
);
```

### From inside another task (with wait)

```ts
import { childTask } from "./child-task";

export const parentTask = task({
  id: "parent",
  run: async (payload) => {
    // Fire and forget
    await childTask.trigger({ data: "value" });

    // Trigger and wait for result
    const result = await childTask.triggerAndWait({ data: "value" });

    // Batch trigger and wait for all
    const results = await childTask.batchTriggerAndWait([
      { payload: { data: "a" } },
      { payload: { data: "b" } },
    ]);
  },
});
```

**IMPORTANT:** Always use type-only imports (`import type { ... }`) when triggering from backend code outside the `trigger/` directory — avoids bundling task code into your app.

## Scheduled Tasks (Cron)

```ts
import { schedules } from "@trigger.dev/sdk";

export const dailyCleanup = schedules.task({
  id: "daily-cleanup",
  cron: "0 3 * * *",                          // 3 AM UTC daily
  run: async (payload) => {
    // payload.timestamp — when scheduled to run (Date)
    // payload.lastTimestamp — previous run time (Date | undefined)
    // payload.timezone — IANA timezone string
    // payload.scheduleId — the schedule ID
  },
});
```

### Cron with timezone

```ts
cron: {
  pattern: "0 9 * * 1-5",       // 9 AM weekdays
  timezone: "America/New_York",
  environments: ["PRODUCTION"],  // optional: restrict to specific envs
}
```

### Imperative schedules (dynamic, per-user)

```ts
import { schedules } from "@trigger.dev/sdk";

await schedules.create({
  task: "daily-cleanup",
  cron: "0 */6 * * *",              // every 6 hours
  externalId: `user-${userId}`,     // link to your user
  deduplicationKey: `cleanup-${userId}`,
});
```

Cron syntax: `minute hour day-of-month month day-of-week`. Supports `L` (last) in day fields. No seconds.

## Waits (Pause & Resume)

```ts
import { wait } from "@trigger.dev/sdk";

// Wait for a duration
await wait.for({ seconds: 30 });
await wait.for({ hours: 1 });
await wait.for({ days: 7 });

// Wait until a specific date
await wait.until({ date: new Date("2025-12-31") });

// Human-in-the-loop: wait for external approval
const token = await wait.forToken({ id: `approve-${orderId}`, timeout: "24h" });
```

### Completing a wait token (from your backend)

```ts
import { waitTokens } from "@trigger.dev/sdk";

// Approve
await waitTokens.complete(`approve-${orderId}`, { approved: true });

// Or reject
await waitTokens.complete(`approve-${orderId}`, { approved: false });
```

Waits longer than ~5 seconds checkpoint the task — no compute charges while paused.

## Queues & Concurrency

```ts
export const serialTask = task({
  id: "serial-task",
  queue: { concurrencyLimit: 1 },   // process one at a time
  run: async (payload) => { /* ... */ },
});

export const parallelTask = task({
  id: "parallel-task",
  queue: { concurrencyLimit: 10 },  // up to 10 concurrent runs
  run: async (payload) => { /* ... */ },
});
```

For per-user concurrency, use dynamic queue names:

```ts
const handle = await tasks.trigger<typeof myTask>("my-task", payload, {
  queue: { name: `user-${userId}`, concurrencyLimit: 1 },
});
```

## Realtime & Streaming

### Subscribe to run updates (React)

```tsx
import { useRealtimeRun } from "@trigger.dev/react-hooks";

function RunStatus({ runId }: { runId: string }) {
  const { run } = useRealtimeRun(runId);
  return <div>Status: {run?.status}</div>;
}
```

### Stream AI output from a task

```ts
import { task, streams } from "@trigger.dev/sdk";

export const aiTask = task({
  id: "ai-chat",
  run: async (payload) => {
    const stream = await streams.define("ai-output", { type: "text" });
    // Pipe your AI SDK response to the stream
    const response = await openai.chat.completions.create({ /* ... */ stream: true });
    await streams.pipe(stream, response);
  },
});
```

### Consume stream in React

```tsx
import { useRealtimeStream } from "@trigger.dev/react-hooks";

function AIOutput({ runId }: { runId: string }) {
  const { data } = useRealtimeStream(runId, "ai-output");
  return <div>{data}</div>;
}
```

## Lifecycle Hooks

### Per-task

```ts
export const myTask = task({
  id: "my-task",
  onStartAttempt: async ({ payload, ctx }) => { /* before each attempt */ },
  onSuccess: async ({ payload, output, ctx }) => { /* on success */ },
  onFailure: async ({ payload, error, ctx }) => { /* on final failure */ },
  catchError: async ({ payload, error, ctx, retry }) => { /* custom error handling */ },
  run: async (payload) => { /* ... */ },
});
```

### Global (in `init.ts` or `trigger.config.ts`)

```ts
import { tasks } from "@trigger.dev/sdk";

tasks.onStartAttempt(({ ctx, payload, task }) => { console.log("Run started", ctx.run); });
tasks.onSuccess(({ ctx, output }) => { console.log("Run finished", ctx.run); });
tasks.onFailure(({ ctx, error }) => { console.log("Run failed", ctx.run); });
```

## Build Extensions

Customize the build to include system packages, browsers, Python, etc.

```ts
// trigger.config.ts
import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { pythonExtension } from "@trigger.dev/build/extensions/python";

export default defineConfig({
  project: "<project-ref>",
  build: {
    extensions: [
      prismaExtension({ schema: "prisma/schema.prisma" }),
      pythonExtension({ requirementsFile: "./requirements.txt" }),
    ],
  },
});
```

Available extensions: `prismaExtension`, `pythonExtension`, `playwright`, `puppeteer`, `ffmpeg`, `aptGet`, `additionalFiles`, `additionalPackages`, `syncEnvVars`, `esbuildPlugin`.

## Deployment

- Deploy: `npx trigger.dev@latest deploy`
- Deploy to staging: `npx trigger.dev@latest deploy --env staging`
- Deploy from CI: `npx trigger.dev@latest deploy --self-hosted --skip-typecheck` (set `TRIGGER_ACCESS_TOKEN`)
- Environments: `DEV`, `PREVIEW`, `STAGING`, `PROD`
- Preview branches: create isolated environments per git branch. Integrates with Vercel.
- Versioning is atomic — new deploys don't affect currently running tasks.

## Logging & Tags

```ts
import { logger, task } from "@trigger.dev/sdk";

export const myTask = task({
  id: "my-task",
  run: async (payload, { ctx }) => {
    logger.info("Processing", { userId: payload.userId });
    logger.warn("Slow response", { duration: 5000 });
    logger.error("Failed to process", { error: "timeout" });

    // Tags for filtering in dashboard and realtime
    await ctx.run.addTag(`user:${payload.userId}`);
  },
});
```

## Key Gotchas

- Tasks MUST be in the `trigger/` directory (or dirs specified in config). They won't be detected elsewhere.
- Always use `import type` when importing tasks from backend code to avoid bundling task code.
- Never import from `@trigger.dev/sdk/v3` — always `@trigger.dev/sdk`.
- Never use `client.defineJob()` — that's the deprecated v2 API.
- Dev scheduled tasks only fire while `npx trigger.dev@latest dev` is running.
- Staging/prod scheduled tasks only fire from the current (latest) deployment.
- `TRIGGER_SECRET_KEY` must be set to trigger tasks from your backend. Find it on the API Keys page.
- For preview branches, also set `TRIGGER_PREVIEW_BRANCH`.
- Self-hosting: available via Docker Compose or Kubernetes Helm chart.
- The `run` function's return value must be JSON-serializable.
