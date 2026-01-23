import fs from 'fs'
import path from 'path'
import { requireAuth, requireRole } from '../../../../../middleware/admin-auth.js'

const OTP_FILE = path.join(process.cwd(), 'safety', 'otp_requests.json')

function generateOtp() { return String(Math.floor(100000 + Math.random()*900000)) }

export async function POST(req) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!requireRole(auth, ['db-admin','super-admin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  try {
    const { target, via='email', token } = await req.json()
    const otp = generateOtp()
    const rec = { token, otp, target, via, createdAt: new Date().toISOString(), requestedBy: auth.sub || auth.email }
    const arr = fs.existsSync(OTP_FILE) ? JSON.parse(fs.readFileSync(OTP_FILE, 'utf8')) : []
    arr.push(rec)
    fs.mkdirSync(path.dirname(OTP_FILE), { recursive: true })
    fs.writeFileSync(OTP_FILE, JSON.stringify(arr, null, 2))
    // TODO: send SMS/email via configured provider. For now return OTP in response (dev only)
    return new Response(JSON.stringify({ ok: true, otp }), { status: 201 })
  } catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 500 }) }
}
