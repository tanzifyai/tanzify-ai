#!/usr/bin/env node
// Approve an override token (admin only). Adds token to safety/approved_overrides.json
import fs from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.error('Usage: node scripts/approve-override.js <token> [--expire-minutes N]');
  process.exit(1);
}
const token = argv[0];
const safetyDir = path.join(process.cwd(), 'safety');
fs.mkdirSync(safetyDir, { recursive: true });
const approvedFile = path.join(safetyDir, 'approved_overrides.json');
let arr = [];
if (fs.existsSync(approvedFile)) arr = JSON.parse(fs.readFileSync(approvedFile, 'utf8')) || [];
if (!arr.includes(token)) arr.push(token);
fs.writeFileSync(approvedFile, JSON.stringify(arr, null, 2));
console.log('Token approved and stored in', approvedFile);
