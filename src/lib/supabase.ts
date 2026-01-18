import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DatabaseUser {
  id: string;
  firebase_uid: string;
  email: string;
  name: string;
  credits: number;
  minutes_used: number;
  subscription_plan?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTranscription {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  s3_key: string;
  transcript: string;
  language: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DatabaseSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  plan_name: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for database operations
export const db = {
  // User operations
  async createUser(userData: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUser(firebaseUid: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserCredits(userId: string, credits: number) {
    const { data, error } = await supabase
      .from('users')
      .update({ credits, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserMinutes(userId: string, minutesUsed: number) {
    const { data, error } = await supabase
      .from('users')
      .update({ minutes_used: minutesUsed, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Transcription operations
  async createTranscription(transcriptionData: Omit<DatabaseTranscription, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('transcriptions')
      .insert(transcriptionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserTranscriptions(userId: string) {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateTranscriptionStatus(id: string, status: DatabaseTranscription['status'], transcript?: string) {
    const updateData: Partial<DatabaseTranscription> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (transcript) {
      updateData.transcript = transcript;
    }

    const { data, error } = await supabase
      .from('transcriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Subscription operations
  async createSubscription(subscriptionData: Omit<DatabaseSubscription, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSubscriptionStatus(subscriptionId: string, status: DatabaseSubscription['status']) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};