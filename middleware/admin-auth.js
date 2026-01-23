import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import os from 'os'

const AUDIT_LOG = path.join(process.cwd(), 'logs', 'admin_access.log')
const RATE_FILE = path.join(process.cwd(), 'tmp', 'admin_rate_limits.json')
const SESSIONS_FILE = path.join(process.cwd(), 'safety', 'admin_sessions.json')
const WHITELIST = (process.env.ADMIN_IP_WHITELIST || '').split(',').map(s=>s.trim()).filter(Boolean)
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function writeLog(obj) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true })
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(Object.assign({ when: new Date().toISOString() }, obj)) + '\n')
  } catch (e) { /* best-effort */ }
}

function getIp(req) {
  try {
    const hdr = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    if (hdr) return hdr.split(',')[0].trim()
    // fallback: may not be available in serverless; return unknown
    return req.headers.get('x-forwarded-for') || 'unknown'
  } catch (e) { return 'unknown' }
}

function rateLimitCheck(ip) {
  try {
    fs.mkdirSync(path.dirname(RATE_FILE), { recursive: true })
    let data = {}
    if (fs.existsSync(RATE_FILE)) data = JSON.parse(fs.readFileSync(RATE_FILE, 'utf8'))
    const now = Date.now()
    const window = 60 * 1000 // 1 minute window
    const max = Number(process.env.ADMIN_RATE_LIMIT || 30)
    if (!data[ip]) data[ip] = []
    data[ip] = data[ip].filter(t => now - t < window)
    if (data[ip].length >= max) {
      fs.writeFileSync(RATE_FILE, JSON.stringify(data, null, 2))
      return false
    }
    data[ip].push(now)
    fs.writeFileSync(RATE_FILE, JSON.stringify(data, null, 2))
    return true
  } catch (e) { return true }
}

function applySecurityHeaders() {
  return {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none'; connect-src 'self'",
    'X-XSS-Protection': '1; mode=block'
  }
}

async function verifyJwt(token) {
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET || '', { algorithms: JWT_SECRET ? undefined : ['HS256'] })
    return decoded
  } catch (e) { return null }
}

function sessionValid(sessionId) {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return false
    const sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'))
    const s = sessions.find(x => x.id === sessionId)
    if (!s) return false
    const last = new Date(s.lastSeen).getTime()
    const now = Date.now()
    const timeout = (Number(process.env.ADMIN_SESSION_TIMEOUT_MINUTES) || 15) * 60 * 1000
    if (now - last > timeout) return false
    // update lastSeen
    s.lastSeen = new Date().toISOString()
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2))
    return true
  } catch (e) { return false }
}

export async function requireAuth(req) {
  const ip = getIp(req)
  if (WHITELIST.length > 0 && !WHITELIST.includes(ip) && !WHITELIST.includes('0.0.0.0')) {
    writeLog({ action: 'auth_block_ip', ip, path: req.url })
    return new Response(JSON.stringify({ error: 'IP not allowed' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }
  if (!rateLimitCheck(ip)) {
    writeLog({ action: 'auth_rate_limited', ip, path: req.url })
    return new Response(JSON.stringify({ error: 'rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })
  }

  const authHeader = req.headers.get('authorization') || ''
  let token = null
  if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim()
  // also allow session cookie
  if (!token) {
    const cookie = req.headers.get('cookie') || ''
    const m = cookie.match(/admin_session=([^;]+)/)
    if (m) token = m[1]
  }

  const jwtPayload = await verifyJwt(token)
  if (!jwtPayload) {
    writeLog({ action: 'auth_failed', ip, path: req.url })
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  // session check (if present)
  if (jwtPayload.sessionId && !sessionValid(jwtPayload.sessionId)) {
    writeLog({ action: 'auth_session_expired', ip, user: jwtPayload.sub || jwtPayload.email })
    return new Response(JSON.stringify({ error: 'session expired' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  // audit success
  writeLog({ action: 'auth_success', ip, user: jwtPayload.sub || jwtPayload.email, path: req.url })
  return jwtPayload
}

export function requireRole(user, allowedRoles=[]) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  const role = user && (user.role || user['x-hasura-role'] || user.role_name || 'viewer')
  if (allowedRoles.includes(role) || (role === 'super-admin')) return true
  return false
}

export function securityHeaders() {
  return applyHeaders(applySecurityHeaders())
}

function applyHeaders(obj) {
  const headers = new Headers()
  Object.entries(obj).forEach(([k,v]) => headers.set(k, v))
  return headers
}

export function addSecurityHeadersToResponse(resp) {
  const headers = applySecurityHeaders()
  for (const k of Object.keys(headers)) resp.headers.set(k, headers[k])
  return resp
}

export default { requireAuth, requireRole, addSecurityHeadersToResponse }
