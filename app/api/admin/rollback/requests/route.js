import fs from 'fs'
import path from 'path'
import { requireAuth, requireRole } from '../../../../../middleware/admin-auth.js'

const REQ_FILE = path.join(process.cwd(), 'safety', 'override_requests.json')

export async function GET(req) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!requireRole(auth, ['viewer','db-admin','super-admin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  try {
    const arr = fs.existsSync(REQ_FILE) ? JSON.parse(fs.readFileSync(REQ_FILE, 'utf8')) : []
    return new Response(JSON.stringify(arr), { status: 200 })
  } catch (e) { return new Response(JSON.stringify([]), { status: 500 }) }
}

export async function POST(req) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!requireRole(auth, ['viewer','db-admin','super-admin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  try {
    const body = await req.json()
    const arr = fs.existsSync(REQ_FILE) ? JSON.parse(fs.readFileSync(REQ_FILE, 'utf8')) : []
    arr.push(Object.assign({ requestedAt: new Date().toISOString() }, body))
    fs.mkdirSync(path.dirname(REQ_FILE), { recursive: true })
    fs.writeFileSync(REQ_FILE, JSON.stringify(arr, null, 2))
    return new Response(JSON.stringify({ ok: true }), { status: 201 })
  } catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 500 }) }
}
