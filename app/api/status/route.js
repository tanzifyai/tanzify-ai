import fs from 'fs';
import path from 'path';

export async function GET() {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  let version = 'unknown';
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    version = pkg.version || version;
  } catch (e) {}

  const uptime = process.uptime();
  const now = new Date().toISOString();

  const payload = {
    status: 'ok',
    version,
    time: now,
    uptime_seconds: Math.floor(uptime),
    env: {
      node_env: process.env.NODE_ENV || 'development'
    }
  };

  return new Response(JSON.stringify(payload), { status: 200 });
}

export const runtime = 'nodejs';
