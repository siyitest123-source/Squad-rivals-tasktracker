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

## Deploy on Vercel + connect the database

Until a database is connected, the site loads but shows "Offline — changes not
saved". These steps turn on shared saving + the activity log.

1. **Import the repo.** Vercel → **Add New → Project** → import
   `Squad-rivals-tasktracker`. No build settings needed (it's a static file plus
   serverless functions). Click **Deploy**.
2. **Create a database.** Open the project → **Storage** tab → **Create Database**
   → **Postgres** (Neon) → pick a region near your users → **Create**.
3. **Connect it to the project.** On the database page click **Connect Project**
   (or **Connect** during creation) and select this project + the
   **Production** (and Preview) environments. This automatically adds the
   `POSTGRES_URL` / `DATABASE_URL` environment variables — you do **not** copy any
   secret by hand.
4. **Redeploy so the functions see the new variables.** Project → **Deployments**
   → the latest one → **⋯ → Redeploy**. (Env vars only reach the serverless
   functions on a fresh deploy.)
5. **Open the site.** On first load it auto-creates its tables (`dashboard_state`,
   `activity_log`) and seeds the dashboard from the defaults in `index.html`.
   There is **no migration step**.

That's it. The header will now say "All changes saved", every edit (statuses,
deadlines, add/remove tasks, reassignment, workstream/risk/deliverable text) is
saved to Postgres and shared with everyone, and each change is recorded in the
**Activity** tab.

If it still says "Offline": confirm the database shows this project under
**Connected Projects**, and that you redeployed *after* connecting it.

## Editing defaults

The seed data (people, workstreams, pipelines, deliverables, risks) lives at the
top of the `<script>` in `index.html`, between the
`EDIT BELOW THIS LINE` / `EDIT ABOVE THIS LINE` markers. Once the database has
state, those defaults are only used as a fallback — live edits are stored in the
database.
