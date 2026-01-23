#!/usr/bin/env node
// Generate an override request token that an admin can approve.
import fs from 'fs';
import path from 'path';

const safetyDir = path.join(process.cwd(), 'safety');
fs.mkdirSync(safetyDir, { recursive: true });

function generateToken() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const token = generateToken();
const reqFile = path.join(safetyDir, 'override_requests.json');
const now = new Date().toISOString();
let arr = [];
if (fs.existsSync(reqFile)) arr = JSON.parse(fs.readFileSync(reqFile, 'utf8')) || [];
arr.push({ token, requestedAt: now, requestedBy: process.env.USER || process.env.USERNAME || 'cli' });
fs.writeFileSync(reqFile, JSON.stringify(arr, null, 2));
console.log('Override request created. Share this token with an admin for approval:');
console.log('  TOKEN:', token);
console.log('\nAdmin can approve by running: node scripts/approve-override.js', token);
