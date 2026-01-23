#!/usr/bin/env node
// scripts/verify-all.mjs
// Runs validation, migrations, verification, and payment tests sequentially.

import { spawn } from 'child_process';
import path from 'path';
import process from 'process';

function runNodeScript(scriptPath, args = [], env = {}) {
  return new Promise((resolve, reject) => {
    const nodeBin = process.execPath; // absolute node path
    const fullArgs = [scriptPath, ...args];
    const child = spawn(nodeBin, fullArgs, {
      stdio: 'inherit',
      env: { ...process.env, ...env },
      shell: false,
    });

    child.on('error', (err) => reject(err));
    child.on('exit', (code) => {
      if (code === 0) resolve(); else reject(new Error(`Exit code ${code}`));
    });
  });
}

async function main() {
  console.log('Starting unified verification (verify:all)');
  const root = process.cwd();
  const scripts = [
    path.join(root, 'scripts', 'validate-env.js'),
    path.join(root, 'scripts', 'run-migrations.js'),
    path.join(root, 'scripts', 'verify-migrations.js'),
    path.join(root, 'scripts', 'test-payment-flow.js'),
  ];

  // Ensure Node >= 18 for global fetch
  const nodeVer = process.versions.node.split('.')[0];
  if (Number(nodeVer) < 18) {
    console.warn('Node version <18 detected — some scripts may require global fetch. Consider upgrading Node.');
  }

  try {
    console.log('\n1/4 - validate-env');
    await runNodeScript(scripts[0]);

    console.log('\n2/4 - run-migrations');
    await runNodeScript(scripts[1], [], { DATABASE_URL: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL });

    console.log('\n3/4 - verify-migrations');
    await runNodeScript(scripts[2], [], { DATABASE_URL: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL });

    console.log('\n4/4 - test-payment-flow');
    // test-payment-flow requires signing payloads; ensure webhook secret present
    await runNodeScript(scripts[3], [], {});

    console.log('\nVERIFY ALL: SUCCESS — all checks passed');
    process.exit(0);
  } catch (err) {
    console.error('\nVERIFY ALL: FAILURE —', err.message || err);
    process.exit(2);
  }
}

main();
