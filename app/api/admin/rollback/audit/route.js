import fs from 'fs'
import path from 'path'
import { requireAuth, requireRole } from '../../../../../middleware/admin-auth.js'

const AUDIT = path.join(process.cwd(), 'logs', 'rollback_audit.log')

export async function GET(req) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!requireRole(auth, ['viewer','db-admin','super-admin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  try {
    if (!fs.existsSync(AUDIT)) return new Response(JSON.stringify([]), { status: 200 })
    const lines = fs.readFileSync(AUDIT, 'utf8').trim().split('\n').filter(Boolean)
    const parsed = lines.map(l => { try { return JSON.parse(l) } catch (e) { return { raw: l } } })
    return new Response(JSON.stringify(parsed.reverse()), { status: 200 })
  } catch (e) { return new Response(JSON.stringify([]), { status: 500 }) }
}
