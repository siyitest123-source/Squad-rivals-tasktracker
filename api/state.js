// Serverless function backing the dashboard's shared state.
//
// GET  /api/state  -> { state: <saved JSON> | null, updatedAt }
// POST /api/state  -> body { state: <JSON> }  upserts the single row, returns { ok, updatedAt }
//
// Storage: one row (id = 1) holding the whole dashboard as JSONB. The table is
// created on demand, so there is no separate migration step — just provision a
// Postgres database on Vercel (which sets POSTGRES_URL / DATABASE_URL) and go.

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
      CREATE TABLE IF NOT EXISTS dashboard_state (
        id integer PRIMARY KEY,
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    if (req.method === "GET") {
      const rows = await sql`SELECT data, updated_at FROM dashboard_state WHERE id = 1`;
      if (rows.length === 0) {
        res.status(200).json({ state: null });
        return;
      }
      res.status(200).json({ state: rows[0].data, updatedAt: rows[0].updated_at });
      return;
    }

    if (req.method === "POST") {
      const body =
        req.body && typeof req.body === "object"
          ? req.body
          : JSON.parse(req.body || "{}");
      const state = body.state ?? body;

      if (!state || typeof state !== "object") {
        res.status(400).json({ error: "Expected a JSON body { state: {...} }" });
        return;
      }

      await sql`
        INSERT INTO dashboard_state (id, data, updated_at)
        VALUES (1, ${JSON.stringify(state)}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      `;
      res.status(200).json({ ok: true, updatedAt: new Date().toISOString() });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
