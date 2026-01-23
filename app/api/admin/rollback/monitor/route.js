import { Client } from 'pg'
import dotenv from 'dotenv'
import { requireAuth, requireRole } from '../../../../../middleware/admin-auth.js'
dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL

export async function GET(req) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!requireRole(auth, ['viewer','db-admin','super-admin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  if (!DATABASE_URL) return new Response(JSON.stringify({ error: 'no db' }), { status: 500 })
  const pg = new Client({ connectionString: DATABASE_URL })
  await pg.connect()
  try {
    const res = await pg.query(`SELECT count(*) AS active FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND state <> 'idle'`)
    const active = Number(res.rows[0].active || 0)
    // crude progress: check migrations table size
    const m = await pg.query(`SELECT count(*) AS total FROM schema_migrations`)
    const total = Number(m.rows[0].total || 0)
    await pg.end()
    return new Response(JSON.stringify({ activeConnections: active, progressPct: 0, migrationsApplied: total }), { status: 200 })
  } catch (e) { await pg.end(); return new Response(JSON.stringify({ error: String(e) }), { status: 500 }) }
}
