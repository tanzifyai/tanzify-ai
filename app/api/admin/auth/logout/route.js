import dotenv from 'dotenv'
import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

dotenv.config()
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL
const AUDIT_LOG = path.join(process.cwd(), 'logs', 'admin_access.log')

function writeAudit(entry) {
  try { fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true }); fs.appendFileSync(AUDIT_LOG, JSON.stringify(Object.assign({ when: new Date().toISOString() }, entry)) + '\n') } catch (e) { }
}

export async function POST(req) {
  try {
    // read token from cookie or body
    const cookie = req.headers.get('cookie') || ''
    const m = cookie.match(/admin_session=([^;]+)/)
    const body = await req.json().catch(()=>({}))
    const token = (m && m[1]) || body.token
    if (!token) return new Response(JSON.stringify({ ok: true }), { status: 200 })

    if (DATABASE_URL) {
      const pg = new Client({ connectionString: DATABASE_URL })
      await pg.connect()
      try {
        await pg.query('DELETE FROM admin_sessions WHERE token = $1', [token])
      } finally { await pg.end() }
    }

    writeAudit({ action: 'logout', token, ip: req.headers.get('x-forwarded-for') || 'unknown' })

    const resp = new Response(JSON.stringify({ ok: true }), { status: 200 })
    resp.headers.set('Set-Cookie', `admin_session=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Strict`)
    return resp
  } catch (e) { writeAudit({ action: 'logout_error', error: String(e) }); return new Response(JSON.stringify({ error: String(e) }), { status: 500 }) }
}
