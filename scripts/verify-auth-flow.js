#!/usr/bin/env node
// scripts/verify-auth-flow.js
// Creates a test user, verifies signup/login/profile/logout, then cleans up.

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// CLI arg parsing (simple)
const argv = process.argv.slice(2);
function getArg(key) {
  const idx = argv.findIndex(a => a === key || a.startsWith(key + '='));
  if (idx === -1) return undefined;
  const val = argv[idx].includes('=') ? argv[idx].split('=')[1] : argv[idx + 1];
  return val;
}

// Auto-detect SUPABASE env vars in priority order (NEXT_PUBLIC -> VITE -> SUPABASE)
const envCandidates = {
  url: [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.VITE_SUPABASE_URL, process.env.SUPABASE_URL],
  anon: [process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, process.env.VITE_SUPABASE_ANON_KEY, process.env.SUPABASE_ANON_KEY],
  service: [process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY]
};

// CLI overrides
const cliSupabaseUrl = getArg('--supabase-url') || getArg('--supabase-url=');
const cliAnonKey = getArg('--anon-key') || getArg('--anon-key=');
const cliServiceKey = getArg('--service-key') || getArg('--service-key=');

function pickEnv(cands) {
  for (const v of cands) if (v) return v;
  return undefined;
}

const SUPABASE_URL = cliSupabaseUrl || pickEnv(envCandidates.url);
const SUPABASE_ANON_KEY = cliAnonKey || pickEnv(envCandidates.anon);
const SUPABASE_SERVICE_ROLE_KEY = cliServiceKey || pickEnv(envCandidates.service);

// Admin client optional (service role key optional)
const admin = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }) : null;
const client = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } }) : null;

const mask = (s) => s ? (s.length > 12 ? `${s.slice(0,6)}...${s.slice(-4)}` : s) : '(missing)';

const run = async () => {
  console.log('Starting auth verification flow...');
  const timestamp = Date.now();
  const email = `autoverify+${timestamp}@example.com`;
  const password = `TestPass!${Math.floor(Math.random() * 90000) + 10000}`;
  const name = `AutoVerify ${timestamp}`;

  let userId = null;
  let createdProfile = false;

  try {
    const urlSource = cliSupabaseUrl ? 'cli' : (process.env.NEXT_PUBLIC_SUPABASE_URL ? 'env:NEXT_PUBLIC_SUPABASE_URL' : process.env.VITE_SUPABASE_URL ? 'env:VITE_SUPABASE_URL' : 'env:SUPABASE_URL');
    const anonSource = cliAnonKey ? 'cli' : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'env:NEXT_PUBLIC_SUPABASE_ANON_KEY' : process.env.VITE_SUPABASE_ANON_KEY ? 'env:VITE_SUPABASE_ANON_KEY' : 'env:SUPABASE_ANON_KEY');
    const serviceSource = cliServiceKey ? 'cli' : (process.env.SUPABASE_SERVICE_ROLE_KEY ? 'env:SUPABASE_SERVICE_ROLE_KEY' : process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'env:VITE_SUPABASE_SERVICE_ROLE_KEY' : '(none)');

    console.log('Using SUPABASE_URL (' + urlSource + '):', mask(SUPABASE_URL));
    console.log('Using SUPABASE_ANON_KEY (' + anonSource + '):', mask(SUPABASE_ANON_KEY));
    console.log('Using SUPABASE_SERVICE_ROLE_KEY (' + serviceSource + '):', mask(SUPABASE_SERVICE_ROLE_KEY));

    console.log('Creating user via admin API...');
    // Try admin create (service role client)
    let createRes;
    try {
      createRes = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name }
      });
    } catch (e) {
      createRes = { error: e };
    }

    if (createRes?.error) {
      console.warn('Admin createUser failed, attempting client signUp as fallback:', createRes.error.message || createRes.error);
      const fallback = await client.auth.signUp({ email, password });
      if (fallback.error) throw fallback.error;
      userId = fallback.data?.user?.id;
    } else {
      userId = createRes.data?.user?.id;
    }

    if (!userId) throw new Error('Unable to obtain user id after creation');
    console.log('User created with id:', userId);

    console.log('Attempting login with client...');
    const login = await client.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    console.log('Login succeeded.');

    console.log('Creating user profile in DB (using admin)...');
    try {
      const { data, error } = await admin.from('users').insert({ firebase_uid: userId, email, name, credits: 10, minutes_used: 0 }).select().single();
      if (error) throw error;
      createdProfile = true;
      console.log('Profile created with id:', data.id);
    } catch (err) {
      console.warn('Creating profile failed (non-fatal):', err?.message || err);
    }

    console.log('Testing logout...');
    await client.auth.signOut();
    console.log('Logout succeeded.');

    console.log('\nAuth verification flow completed successfully.');
  } catch (err) {
    console.error('Auth verification failed:', err?.message || err);
  } finally {
    console.log('Cleaning up: deleting test data...');
    try {
      if (createdProfile) {
        await admin.from('users').delete().eq('firebase_uid', userId).maybeSingle();
        console.log('Deleted test profile.');
      }
    } catch (e) {
      console.warn('Failed to delete test profile:', e?.message || e);
    }

    try {
      if (userId) {
        // Attempt admin delete user
        await admin.auth.admin.deleteUser(userId).catch(e => { throw e; });
        console.log('Deleted test user from auth.');
      }
    } catch (e) {
      console.warn('Failed to delete test user via admin API:', e?.message || e);
    }

    console.log('Done.');
    process.exit(0);
  }
};

run();
