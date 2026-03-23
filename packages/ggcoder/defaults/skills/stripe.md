---
name: stripe
description: Stripe CLI — webhook forwarding, event triggers, API logs, resource management
---

You are now equipped with Stripe CLI expertise.

## Prerequisites

Ensure Stripe CLI is installed and authenticated (`stripe login`). Check with `stripe status`. CLI defaults to test mode (`sk_test_` keys).

## Webhook Forwarding (Local Development)

This is the most common use case:

- Forward all events: `stripe listen --forward-to localhost:3000/api/webhooks`
- Forward specific events only: `stripe listen --events payment_intent.succeeded,checkout.session.completed --forward-to localhost:3000/api/webhooks`
- Forward Connect events: `stripe listen --forward-connect-to localhost:3000/api/connect-webhooks`

**IMPORTANT:** `stripe listen` prints a webhook signing secret (`whsec_...`). Your app MUST use this secret (not the Dashboard secret) to verify signatures during local dev. Set it as: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

## Triggering Test Events

- Trigger an event: `stripe trigger payment_intent.succeeded`
- Common events to trigger:
  - `stripe trigger checkout.session.completed`
  - `stripe trigger customer.subscription.created`
  - `stripe trigger invoice.payment_failed`
- List all available events: `stripe trigger --list`

Note: `stripe trigger` creates real test-mode objects. Running it multiple times creates duplicates. Use `stripe fixtures` for repeatable seeding.

## API Log Streaming

- Tail API logs: `stripe logs tail`
- Filter by status: `stripe logs tail --filter-status-code 400`
- Filter by method: `stripe logs tail --filter-http-method POST`
- Filter by path: `stripe logs tail --filter-request-path /v1/charges`

## Resource Management (CRUD)

- Create customer: `stripe customers create --name "Jane Doe" --email jane@example.com`
- List customers: `stripe customers list --limit 5`
- Retrieve: `stripe customers retrieve cus_xxx`
- Update: `stripe customers update cus_xxx --name "Jane Smith"`
- Delete: `stripe customers delete cus_xxx`
- Create payment intent: `stripe payment_intents create --amount 2000 --currency usd`
- List all resource types: `stripe resources`

## Fixtures & Samples

- Run a fixture file: `stripe fixtures fixtures/seed.json`
- List sample integrations: `stripe samples list`
- Clone a sample: `stripe samples create accept-a-payment`

## Auth

- Interactive login: `stripe login`
- Login with API key (CI): `stripe login --api-key sk_test_xxx`
- Show config: `stripe config --list`

## Key Gotchas

- CLI defaults to test mode. Use `--live` for live mode. Never forward live webhooks to localhost.
- Webhook signing secret changes every `stripe listen` session. Update your app's env var each time.
- For CI/CD: create a restricted API key with minimal permissions, use `stripe login --api-key rk_test_xxx`.
- Pairing code auth expires in 60 seconds.
- Override API version: `--api-version 2023-10-16`
- Use `stripe fixtures` instead of `stripe trigger` for repeatable, idempotent test data.
