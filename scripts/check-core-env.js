#!/usr/bin/env node
// scripts/check-core-env.js
// Checks ONLY core environment variables: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import dotenv from 'dotenv';
dotenv.config();

const vars = [
  { name: 'DATABASE_URL', value: process.env.DATABASE_URL },
  { name: 'SUPABASE_URL', value: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL },
  { name: 'SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY }
];

let ok = true;
console.log('Checking core environment variables...');
for (const v of vars) {
  if (!v.value) {
    console.error(`FAIL: ${v.name} is not set`);
    ok = false;
  } else {
    console.log(`OK: ${v.name} is set`);
  }
}

if (!ok) {
  console.error('\nOne or more core environment variables are missing.');
  process.exit(1);
}

console.log('\nAll core environment variables present.');
process.exit(0);
