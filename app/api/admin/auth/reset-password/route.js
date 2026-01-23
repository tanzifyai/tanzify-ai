import dotenv from 'dotenv'
import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { validatePassword } from '../../../../../../lib/password-policy.js'

dotenv.config()
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL
const AUDIT = path.join(process.cwd(), 'logs', 'password_reset.log')

function writeAudit(obj) { try { fs.mkdirSync(path.dirname(AUDIT), { recursive: true }); fs.appendFileSync(AUDIT, JSON.stringify(Object.assign({ when: new Date().toISOString() }, obj)) + '\n') } catch (e) {} }

export async function POST(req) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return new Response(JSON.stringify({ error: 'missing' }), { status: 400 })
    const policy = validatePassword(password)
    if (!policy.ok) return new Response(JSON.stringify({ error: policy.errors.join('; ') }), { status: 400 })

    if (DATABASE_URL) {
      const pg = new Client({ connectionString: DATABASE_URL })
      await pg.connect()
      try {
        const t = await pg.query('SELECT admin_id, expires_at, consumed FROM password_reset_tokens WHERE token = $1', [token])
        if (t.rowCount === 0) { await pg.end(); return new Response(JSON.stringify({ error: 'invalid token' }), { status: 400 }) }
        const row = t.rows[0]
        if (row.consumed) { await pg.end(); return new Response(JSON.stringify({ error: 'token consumed' }), { status: 400 }) }
        if (new Date(row.expires_at) < new Date()) { await pg.end(); return new Response(JSON.stringify({ error: 'token expired' }), { status: 400 }) }

        const adminId = row.admin_id
        // get history
        const hist = await pg.query('SELECT password_hash FROM admin_password_history WHERE admin_id = $1 ORDER BY changed_at DESC LIMIT 5', [adminId])
        const newHash = bcrypt.hashSync(password, 10)
        if (hist.rows.some(r => bcrypt.compareSync(password, r.password_hash))) {
          await pg.end(); return new Response(JSON.stringify({ error: 'cannot reuse recent password' }), { status: 400 })
        }

        await pg.query('UPDATE admin_users SET password_hash = $1, must_change_password = FALSE, last_password_change = now() WHERE id = $2', [newHash, adminId])
        await pg.query('INSERT INTO admin_password_history (admin_id, password_hash) VALUES ($1,$2)', [adminId, newHash])
        await pg.query('UPDATE password_reset_tokens SET consumed = TRUE WHERE token = $1', [token])
      } finally { await pg.end() }
    } else {
      // file fallback
      const f = path.join(process.cwd(), 'safety', 'password_reset_tokens.json')
      const arr = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f,'utf8')) : []
      const idx = arr.findIndex(x => x.token === token)
      if (idx === -1) return new Response(JSON.stringify({ error: 'invalid token' }), { status: 400 })
      const rec = arr[idx]
      if (new Date(rec.expires_at) < new Date()) return new Response(JSON.stringify({ error: 'expired' }), { status: 400 })
      // update admin_users file
      const ufile = path.join(process.cwd(), 'safety', 'admin_users.json')
      const users = fs.existsSync(ufile) ? JSON.parse(fs.readFileSync(ufile,'utf8')) : []
      const uidx = users.findIndex(x => x.id === rec.admin_id)
      const newHash = bcrypt.hashSync(password, 10)
      if (uidx !== -1) {
        users[uidx].password = newHash
        users[uidx].must_change_password = false
      }
      fs.writeFileSync(ufile, JSON.stringify(users,null,2))
      arr.splice(idx,1)
      fs.writeFileSync(f, JSON.stringify(arr,null,2))
    }

    writeAudit({ action: 'password_reset_success', token })
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) { writeAudit({ action: 'password_reset_error', error: String(e) }); return new Response(JSON.stringify({ error: String(e) }), { status: 500 }) }
}
