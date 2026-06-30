// Append-only activity log (mirrors the Replit monorepo's activity_log table).
//
// GET  /api/activity  -> [ { id, actor, action, detail, created_at } ]  (last 100, newest first)
// POST /api/activity  -> body { actor, action, detail }  appends one row, returns it
//
// Separate from /api/state so logging an entry never races with dashboard saves.

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export default async function handler(req, res) {
  if (!connectionString) {
    res.status(500).json({
      error:
        "No database configured. Add a Postgres database in Vercel (Storage tab) so POSTGRES_URL / DATABASE_URL is set.",
    });
    return;
  }

  const sql = neon(connectionString);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS activity_log (
        id bigserial PRIMARY KEY,
        actor text NOT NULL,
        action text NOT NULL,
        detail text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, actor, action, detail, created_at
        FROM activity_log
        ORDER BY created_at DESC, id DESC
        LIMIT 100
      `;
      res.status(200).json(rows);
      return;
    }

    if (req.method === "POST") {
      const body =
        req.body && typeof req.body === "object"
          ? req.body
          : JSON.parse(req.body || "{}");

      const actor = String(body.actor || "Someone").slice(0, 120);
      const action = String(body.action || "").slice(0, 200);
      const detail =
        body.detail != null ? String(body.detail).slice(0, 500) : null;

      if (!action) {
        res.status(400).json({ error: "action is required" });
        return;
      }

      const rows = await sql`
        INSERT INTO activity_log (actor, action, detail)
        VALUES (${actor}, ${action}, ${detail})
        RETURNING id, actor, action, detail, created_at
      `;
      res.status(200).json(rows[0]);
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
