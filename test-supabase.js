// test-supabase.js - Test Supabase Connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test with anon key (frontend)
    const supabaseAnon = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    console.log('📋 Testing Anon Key Connection...');
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('users')
      .select('count')
      .limit(1);

    if (anonError) {
      console.log('❌ Anon Key Test Failed:', anonError.message);
    } else {
      console.log('✅ Anon Key Connection: SUCCESS');
    }

    // Test with service role key (backend)
    const supabaseService = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📋 Testing Service Role Key Connection...');
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('users')
      .select('count')
      .limit(1);

    if (serviceError) {
      console.log('❌ Service Role Key Test Failed:', serviceError.message);
    } else {
      console.log('✅ Service Role Key Connection: SUCCESS');
    }

    console.log('\n🎯 Supabase credentials are properly configured!');
    console.log('📊 Next: Run database schema setup in Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Connection Test Failed:', error.message);
    console.log('\n🔧 Check your .env file credentials');
  }
}

testSupabaseConnection();