import dotenv from 'dotenv'
import { Client } from 'pg'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

dotenv.config()
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL
const RATE_FILE = path.join(process.cwd(), 'tmp', 'forgot_rate.json')
const AUDIT = path.join(process.cwd(), 'logs', 'password_reset.log')

function writeAudit(obj) { try { fs.mkdirSync(path.dirname(AUDIT), { recursive: true }); fs.appendFileSync(AUDIT, JSON.stringify(Object.assign({ when: new Date().toISOString() }, obj)) + '\n') } catch (e) {} }

function rateLimit(ip) {
  try {
    fs.mkdirSync(path.dirname(RATE_FILE), { recursive: true })
    let data = fs.existsSync(RATE_FILE) ? JSON.parse(fs.readFileSync(RATE_FILE, 'utf8')) : {}
    const now = Date.now(); const window = 60*60*1000; const max = 5
    if (!data[ip]) data[ip] = []
    data[ip] = data[ip].filter(t => now - t < window)
    if (data[ip].length >= max) { fs.writeFileSync(RATE_FILE, JSON.stringify(data,null,2)); return false }
    data[ip].push(now); fs.writeFileSync(RATE_FILE, JSON.stringify(data,null,2)); return true
  } catch (e) { return false }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { username } = body
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(ip)) return new Response(JSON.stringify({ error: 'rate limit exceeded' }), { status: 429 })

    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 60*60*1000) // 1h

    if (DATABASE_URL) {
      const pg = new Client({ connectionString: DATABASE_URL })
      await pg.connect()
      try {
        // check user exists
        const res = await pg.query('SELECT id FROM admin_users WHERE id = $1', [username])
        if (res.rowCount === 0) { writeAudit({ action: 'forgot_no_user', username, ip }); return new Response(JSON.stringify({ ok: true }), { status: 200 }) }
        await pg.query('INSERT INTO password_reset_tokens (token, admin_id, expires_at) VALUES ($1,$2,$3)', [token, username, expiresAt.toISOString()])
      } finally { await pg.end() }
    } else {
      // fallback to file storage
      const dbFile = path.join(process.cwd(), 'safety', 'password_reset_tokens.json')
      const arr = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile,'utf8')) : []
      arr.push({ token, admin_id: username, expires_at: expiresAt.toISOString(), created_at: new Date().toISOString() })
      fs.mkdirSync(path.dirname(dbFile), { recursive: true })
      fs.writeFileSync(dbFile, JSON.stringify(arr,null,2))
    }

    // TODO: send email via SMTP/Twilio. For now return token in response for dev.
    writeAudit({ action: 'forgot_requested', username, ip, token })
    return new Response(JSON.stringify({ ok: true, token }), { status: 200 })
  } catch (e) { writeAudit({ action: 'forgot_error', error: String(e) }); return new Response(JSON.stringify({ error: String(e) }), { status: 500 }) }
}
