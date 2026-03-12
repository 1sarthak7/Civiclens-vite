// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Supabase Client
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ubrsmrivmecmsxvwnzzb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicnNtcml2bWVjbXN4dnduenpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzQwMzQsImV4cCI6MjA4ODcxMDAzNH0.QntBaiJkPtc52kUvU9JFVMm6OP9LE_0qrL5Fj23_etU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Get the currently logged-in user with profile info merged.
 * @returns {Promise<object|null>} User object with profile fields or null
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { ...user, ...profile };
}

/**
 * Sign up a new user.
 */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign in with email/password.
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
