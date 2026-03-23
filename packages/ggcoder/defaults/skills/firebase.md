---
name: firebase
description: Firebase — hosting, Cloud Functions, Firestore, emulators, auth
---

You are now equipped with Firebase CLI expertise.

## Prerequisites

Ensure Firebase CLI is installed (`npm i -g firebase-tools`) and authenticated (`firebase login`). For CI: `firebase login:ci` or `firebase login --no-localhost`.

## Project Setup

- Initialize: `firebase init` (interactive wizard for Hosting, Firestore, Functions, Emulators, etc.)
- Initialize specific feature: `firebase init hosting` / `firebase init functions` / `firebase init emulators`
- Set active project: `firebase use <project-id>`
- Add project alias: `firebase use --add` (e.g., dev, staging, prod — stored in `.firebaserc`)
- List projects: `firebase projects:list`
- Create project: `firebase projects:create <project-id> --display-name "My App"`

## Deploying

- Deploy everything: `firebase deploy`
- Deploy only specific services (RECOMMENDED for safety):
  - `firebase deploy --only hosting`
  - `firebase deploy --only functions`
  - `firebase deploy --only functions:myFunction` (single function)
  - `firebase deploy --only firestore:rules`
  - `firebase deploy --only firestore:indexes`
  - `firebase deploy --only storage`
- Deploy with message: `firebase deploy --only hosting -m "v1.2.0"`
- Preview channel: `firebase hosting:channel:deploy staging` (creates temporary preview URL)
- List preview channels: `firebase hosting:channel:list`

Always use `--only` in production to avoid deploying unready changes to other services.

## Local Development (Emulators)

- Start all configured emulators: `firebase emulators:start`
- Start specific ones: `firebase emulators:start --only auth,firestore,functions`
- Run tests against emulators: `firebase emulators:exec "npm test"`
- Persist data between sessions: `firebase emulators:start --import ./data --export-on-exit`
- Export data: `firebase emulators:export ./emulator-data`

Available emulators: auth, firestore, database, functions, hosting, pubsub, storage, eventarc.
Use `firebase emulators:start` instead of the legacy `firebase serve`.

## Cloud Functions

- Deploy all: `firebase deploy --only functions`
- Deploy one: `firebase deploy --only functions:functionName`
- View logs: `firebase functions:log` or `firebase functions:log --only functionName`
- Delete: `firebase functions:delete functionName`
- Interactive shell: `firebase functions:shell`
- Functions v2 (Cloud Run-based) uses `defineSecret()` and `defineString()` for config.

## Firestore

- Deploy rules: `firebase deploy --only firestore:rules`
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Delete collection: `firebase firestore:delete <collection-path> --recursive`
- Always test rules in emulator before deploying.

## Hosting

- Deploy: `firebase deploy --only hosting`
- Preview channel: `firebase hosting:channel:deploy staging`
- Disable: `firebase hosting:disable`
- Multi-site: configure in `firebase.json` under `"hosting"` as array with `"site"` keys.

## Auth

- Export users: `firebase auth:export users.json`
- Import users: `firebase auth:import users.json --hash-algo=BCRYPT`

## Key Gotchas

- Cloud Functions require the Blaze (pay-as-you-go) plan. Spark (free) doesn't support deploying functions.
- Emulator ports are configured in `firebase.json`. Defaults: Auth(9099), Firestore(8080), Functions(5001), Hosting(5000), UI(4000).
- Emulator data is ephemeral by default. Use `--import`/`--export-on-exit` for persistence.
- Project aliases simplify multi-environment workflows. Use `firebase use staging` to switch.
- For GitHub Actions CI: use `FirebaseExtended/action-hosting-deploy@v0`.
- Functions v2 env vars: use `defineSecret('SECRET_NAME')` + Google Cloud Secret Manager.
