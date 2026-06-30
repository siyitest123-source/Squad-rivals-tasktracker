# Squad Rivals — Team Workflow Tracker

A single-page team task tracker for Squad Rivals. Workstreams, per-person views,
pipelines, deliverables, risks, and an activity log. **Everything is editable
in-browser and saved to a shared Postgres database**, so every teammate sees the
same live state. No login.

## Features

- **Click-to-cycle status** on any task row, workstream badge, or pipeline step
  (`planned → doing → review → done → blocked`). Changing task statuses
  re-derives the workstream's overall status automatically.
- **Add tasks** with the "+ New Task" button (pick a workstream + optional
  deadline).
- **Remove tasks** with the × on each row.
- **Inline deadlines** — edit any task's date right on the row.
- **Reassign tasks** — each task has an owner dropdown (per-task reassignment).
- **Editable text** — click to edit workstream titles, risk names + mitigations,
  and deliverable kind / title / description / link.
- **Activity log** (Activity tab) — who changed what and when, grouped by date,
  with colored avatars and relative timestamps. Auto-refreshes every 10s.
- **By Person** tab is a simple team roster (names + roles).
- Every change saves automatically and is shared with the whole team.

## How it works

- `index.html` — the entire UI (no build step). Renders from JS data and talks
  to the API over relative `/api/state` and `/api/activity` paths.
- `api/state.js` — stores the whole dashboard as a single JSONB row in Postgres.
- `api/activity.js` — append-only `activity_log` table (GET last 100, POST one).
- Both serverless functions create their tables on demand — no migrations.

If the database isn't reachable, the dashboard still loads with the built-in
defaults — it shows "Offline — changes not saved" and edits won't persist.

## Deploy on Vercel

1. Import this repo in Vercel (no build settings needed — it's static + a function).
2. **Storage → Create Database → Postgres**, connect it to the project. This sets
   `POSTGRES_URL` / `DATABASE_URL` automatically.
3. Deploy. On first load the dashboard seeds the database with the defaults from
   `index.html`. Done.

## Editing defaults

The seed data (people, workstreams, pipelines, deliverables, risks) lives at the
top of the `<script>` in `index.html`, between the
`EDIT BELOW THIS LINE` / `EDIT ABOVE THIS LINE` markers. Once the database has
state, those defaults are only used as a fallback — live edits are stored in the
database.
