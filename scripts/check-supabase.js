import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function parseEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const obj = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      obj[key] = val;
    }
    return obj;
  } catch (err) {
    return null;
  }
}

const envPath = path.join(repoRoot, '.env');
const env = parseEnv(envPath);
if (!env) {
  console.error('.env not found or unreadable at', envPath);
  process.exit(2);
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env');
  process.exit(3);
}

(async () => {
  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/transcriptions?select=user_id&limit=1`;
    console.log('Querying:', url);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json'
      }
    });

    console.log('HTTP status:', res.status);
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response text:', text.slice(0, 1000));
    }

    if (res.ok) {
      console.log('Supabase REST check succeeded (anon key has read access to `transcriptions`).');
      process.exit(0);
    } else if (res.status === 401 || res.status === 403) {
      console.warn('Supabase returned auth error — anon key may not have permission (RLS or missing).');
      process.exit(4);
    } else {
      console.warn('Supabase returned non-OK status.');
      process.exit(5);
    }
  } catch (err) {
    console.error('Network or fetch error:', err.message || err);
    process.exit(6);
  }
})();
