import fs from 'fs'
import path from 'path'
import { requireAuth, requireRole } from '../../../../../middleware/admin-auth.js'

const REQ_FILE = path.join(process.cwd(), 'safety', 'override_requests.json')
const APPROVED = path.join(process.cwd(), 'safety', 'approved_overrides.json')
const AUDIT = path.join(process.cwd(), 'logs', 'rollback_audit.log')

function writeAudit(entry) {
  try { fs.mkdirSync(path.dirname(AUDIT), { recursive: true }); fs.appendFileSync(AUDIT, JSON.stringify(Object.assign({ when: new Date().toISOString() }, entry)) + '\n') } catch (e) { /* ignore */ }
}

export async function POST(req) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!requireRole(auth, ['db-admin','super-admin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  try {
    const { token, action } = await req.json()
    const requests = fs.existsSync(REQ_FILE) ? JSON.parse(fs.readFileSync(REQ_FILE, 'utf8')) : []
    const idx = requests.findIndex(r => r.token === token)
    if (idx === -1) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })

    const reqItem = requests[idx]
    // record audit
    writeAudit({ action: `request_${action}`, token, requestedBy: reqItem.requestedBy, approvedBy: auth.sub || auth.email })

    if (action === 'approve') {
      const approved = fs.existsSync(APPROVED) ? JSON.parse(fs.readFileSync(APPROVED, 'utf8')) : []
      if (!approved.includes(token)) approved.push(token)
      fs.mkdirSync(path.dirname(APPROVED), { recursive: true })
      fs.writeFileSync(APPROVED, JSON.stringify(approved, null, 2))
      // remove request
      requests.splice(idx, 1)
      fs.writeFileSync(REQ_FILE, JSON.stringify(requests, null, 2))
      // TODO: notify Slack via separate worker
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    // reject
    requests.splice(idx, 1)
    fs.writeFileSync(REQ_FILE, JSON.stringify(requests, null, 2))
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) { writeAudit({ action: 'approve_error', error: String(e) }); return new Response(JSON.stringify({ error: String(e) }), { status: 500 }) }
}
