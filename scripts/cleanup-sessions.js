#!/usr/bin/env node
// Removes expired admin sessions from DB
import { Client } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL
if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1) }
const pg = new Client({ connectionString: DATABASE_URL })

async function run() {
  await pg.connect()
  try {
    const res = await pg.query('DELETE FROM admin_sessions WHERE expires_at < now() RETURNING id')
    console.log('Removed expired sessions:', res.rowCount)
  } finally { await pg.end() }
}

run().catch(e => { console.error(e); process.exit(2) })
