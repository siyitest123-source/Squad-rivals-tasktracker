# Squad Rivals — Team Workflow Tracker

A single-page team task tracker for Squad Rivals. Workstreams, per-person views,
pipelines, deliverables, and risks. **Statuses are click-to-cycle and saved to a
shared Postgres database**, so every teammate sees the same live state.

## How it works

- `index.html` — the entire UI (no build step). Renders from JS data and talks
  to the API over a relative `/api/state` path.
- `api/state.js` — a Vercel serverless function. Stores the whole dashboard as a
  single JSONB row in Postgres. Creates its table on demand (no migrations).
- Click any task row, workstream badge, or pipeline step to cycle its status
  (`planned → doing → review → done → blocked`). The change saves automatically
  and is shared with everyone.

If the database isn't reachable, the dashboard still loads with the built-in
defaults — it just shows "Offline — changes not saved" and edits won't persist.

## Deploy on Vercel

1. Import this repo in Vercel (no build settings needed — it's static + a function).
2. **Storage → Create Database → Postgres**, connect it to the project. This sets
   `POSTGRES_URL` / `DATABASE_URL` automatically.
3. Deploy. On first load the dashboard seeds the database with the defaults from
   `index.html`. Done.

## Editing defaults

The seed data (people, workstreams, pipelines, deliverables, risks, password)
lives at the top of the `<script>` in `index.html`, between the
`EDIT BELOW THIS LINE` / `EDIT ABOVE THIS LINE` markers. Once the database has
state, those defaults are only used as a fallback — live edits are stored in the
database.
