import dotenv from 'dotenv'
import { Client } from 'pg'
import { requireAuth, requireRole } from '../../../../middleware/admin-auth.js'
import fs from 'fs'
import path from 'path'

dotenv.config()
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL

export async function GET(req) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!requireRole(auth, ['viewer','db-admin','super-admin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  if (!DATABASE_URL) return new Response(JSON.stringify({ sessions: [] }), { status: 200 })
  const pg = new Client({ connectionString: DATABASE_URL })
  await pg.connect()
  try {
    const res = await pg.query('SELECT id, admin_id, created_at, expires_at FROM admin_sessions ORDER BY created_at DESC LIMIT 100')
    await pg.end()
    return new Response(JSON.stringify({ sessions: res.rows }), { status: 200 })
  } catch (e) { await pg.end(); return new Response(JSON.stringify({ error: String(e) }), { status: 500 }) }
}

export async function POST(req) {
  // support actions: logout-session, logout-all
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!requireRole(auth, ['db-admin','super-admin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  const body = await req.json()
  const action = body.action
  const pg = new Client({ connectionString: DATABASE_URL })
  await pg.connect()
  try {
    if (action === 'logout-session' && body.sessionId) {
      await pg.query('DELETE FROM admin_sessions WHERE id = $1', [body.sessionId])
      await pg.end()
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    if (action === 'logout-all' && body.adminId) {
      await pg.query('DELETE FROM admin_sessions WHERE admin_id = $1', [body.adminId])
      await pg.end()
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    await pg.end()
    return new Response(JSON.stringify({ error: 'invalid action' }), { status: 400 })
  } catch (e) { await pg.end(); return new Response(JSON.stringify({ error: String(e) }), { status: 500 }) }
}
