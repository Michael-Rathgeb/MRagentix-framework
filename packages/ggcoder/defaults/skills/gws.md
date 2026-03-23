---
name: gws
description: Google Workspace CLI — Drive, Gmail, Sheets, Calendar, Chat operations
---

You are now equipped with Google Workspace CLI (gws) expertise.

## Prerequisites

Ensure gws is installed (`npm i -g @anthropic-ai/gws`), authenticated (`gws auth login`), and a Google Cloud project with OAuth credentials is configured. Check with `gws auth status`.

## Auth

- Login with specific scopes: `gws auth login -s drive,gmail,sheets,calendar`
- Login with all scopes: `gws auth login -s drive,gmail,sheets,calendar,chat,admin,docs`
- Check status: `gws auth status`
- Logout: `gws auth logout`

## Drive

- List files: `gws drive list`
- Search: `gws drive list --query "name contains 'report'"`
- Download: `gws drive download <file-id>`
- Upload: `gws drive upload ./file.pdf`
- Create folder: `gws drive create-folder "Project Assets"`
- Move file: `gws drive move <file-id> --to <folder-id>`
- Delete: `gws drive delete <file-id>`

## Sheets

- Read sheet: `gws sheets get <spreadsheet-id>`
- Read specific range: `gws sheets get <spreadsheet-id> --range "Sheet1!A1:D10"`
- Write data: `gws sheets update <spreadsheet-id> --range "Sheet1!A1" --values '[["Name","Score"],["Alice",95]]'`
- Append rows: `gws sheets append <spreadsheet-id> --range "Sheet1" --values '[["Bob",88]]'`
- Create new spreadsheet: `gws sheets create "Budget 2025"`

## Gmail

- List recent messages: `gws gmail list`
- Search: `gws gmail list --query "from:boss@company.com is:unread"`
- Read message: `gws gmail get <message-id>`
- Send email: `gws gmail send --to user@example.com --subject "Hello" --body "Message body"`
- Search with filters: `gws gmail search "has:attachment after:2024/01/01"`

## Calendar

- List upcoming events: `gws calendar list`
- List in date range: `gws calendar list --start 2025-01-01 --end 2025-01-31`
- Create event: `gws calendar create --title "Team Standup" --start "2025-01-15T09:00:00" --end "2025-01-15T09:30:00"`
- Delete event: `gws calendar delete <event-id>`

## Chat

- List spaces: `gws chat spaces`
- Send message: `gws chat send --space <space-id> --text "Hello team"`
- List messages: `gws chat messages --space <space-id>`

## Utilities

- Inspect API schemas: `gws schema`
- Dry-run mode: `gws drive list --dry-run`
- Auto-paginate: `gws drive list --page-all`
- JSON output: `gws drive list --json`

## Key Gotchas

- Requires a Google Cloud project with appropriate APIs enabled and OAuth credentials.
- Only request scopes you need. Google enforces 25-scope limit for unverified apps.
- Tokens refresh automatically but revoked access requires re-login.
- Use `--dry-run` before destructive operations.
- Use `--page-all` carefully on large datasets — many API calls without automatic backoff.
- Sheets can serve as a lightweight database for prototypes and dashboards.
