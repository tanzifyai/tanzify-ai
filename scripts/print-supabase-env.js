#!/usr/bin/env node
// scripts/print-supabase-env.js
import dotenv from 'dotenv';
dotenv.config();

const mask = (s) => s ? (s.length > 12 ? `${s.slice(0,6)}...${s.slice(-4)}` : s) : '(missing)';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const role = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('Detected SUPABASE env keys (masked):');
console.log('SUPABASE_URL:', mask(url));
console.log('SUPABASE_ANON_KEY:', mask(anon));
console.log('SUPABASE_SERVICE_ROLE_KEY:', mask(role));
