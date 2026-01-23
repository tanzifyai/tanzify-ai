import dotenv from 'dotenv'
import { Client } from 'pg'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_JWT_SECRET || 'dev-secret'
const SESSION_TTL_MIN = Number(process.env.ADMIN_SESSION_TTL_MINUTES || 60)
const AUDIT_LOG = path.join(process.cwd(), 'logs', 'admin_access.log')

function writeAudit(entry) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true })
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(Object.assign({ when: new Date().toISOString() }, entry)) + '\n')
  } catch (e) { /* ignore */ }
}

function loadAdminUsers() {
  // ADMIN_USERS can be JSON [{"id":"alice","password":"...","role":"super-admin"},...]
  const envUsers = process.env.ADMIN_USERS
  if (envUsers) {
    try { return JSON.parse(envUsers) } catch (e) { /* fall through */ }
  }
  // fallback single credentials
  if (process.env.ADMIN_USER && process.env.ADMIN_PASS) {
    return [{ id: process.env.ADMIN_USER, password: process.env.ADMIN_PASS, role: process.env.ADMIN_ROLE || 'super-admin' }]
  }
  return []
}

function verifyCredentials(userId, password) {
  const users = loadAdminUsers()
  const u = users.find(x => x.id === userId)
  if (!u) return null
  // support bcrypt-hashed passwords if stored
  const stored = u.password || ''
  if (stored.startsWith('$2') || stored.startsWith('$argon') || stored.startsWith('$pbkdf2')) {
    try {
      if (bcrypt.compareSync(password, stored)) return u
    } catch (e) { return null }
  } else {
    if (stored === password) return u
  }
  return null
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { username, password } = body
    if (!username || !password) return new Response(JSON.stringify({ error: 'missing credentials' }), { status: 400 })

    const user = verifyCredentials(username, password)
    if (!user) {
      writeAudit({ action: 'login_failed', username, ip: req.headers.get('x-forwarded-for') || 'unknown' })
      return new Response(JSON.stringify({ error: 'invalid credentials' }), { status: 401 })
    }

    // generate session id and token
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MIN * 60 * 1000)
    const payload = { sub: user.id, role: user.role || 'db-admin', sessionId }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_TTL_MIN}m` })

    // persist session in DB if available
    if (!DATABASE_URL) {
      writeAudit({ action: 'login_no_db', username })
      // return token in response
      const resp = new Response(JSON.stringify({ token }), { status: 200 })
      resp.headers.set('Set-Cookie', `admin_session=${token}; HttpOnly; Secure; Path=/; Max-Age=${SESSION_TTL_MIN*60}; SameSite=Strict`)
      writeAudit({ action: 'login_success', username, sessionId })
      return resp
    }

    const pg = new Client({ connectionString: DATABASE_URL })
    await pg.connect()
    try {
      await pg.query('INSERT INTO admin_sessions (id, admin_id, token, expires_at) VALUES ($1,$2,$3,$4)', [sessionId, user.id, token, expiresAt.toISOString()])
    } finally { await pg.end() }

    writeAudit({ action: 'login_success', username, sessionId })

    const resp = new Response(JSON.stringify({ token }), { status: 200 })
    resp.headers.set('Set-Cookie', `admin_session=${token}; HttpOnly; Secure; Path=/; Max-Age=${SESSION_TTL_MIN*60}; SameSite=Strict`)
    return resp
  } catch (e) {
    writeAudit({ action: 'login_error', error: String(e) })
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
}
