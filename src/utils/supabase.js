import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fxbtbgwbniidtalnoaad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4YnRiZ3dibmlpZHRhbG5vYWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjc2NzksImV4cCI6MjA4NzcwMzY3OX0.qL7cfIvdR-CGmPzpyDeVNUN_BUZFhNsiRlHzD-FpeSE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth helpers ──
export const auth = {
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
  signInWithGoogle: async () => {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    const googleUser = await GoogleAuth.signIn();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: googleUser.authentication.idToken,
    });
    if (error) throw error;
    return data;
  },
};


// ── Cloud data helpers ──
export const cloudData = {
  // Load user data from cloud
  load: async () => {
    const user = await auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_data')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  // Save user data to cloud
  save: async (userData) => {
    const user = await auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_data')
      .upsert({
        user_id: user.id,
        data: userData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete user data from cloud
  delete: async () => {
    const user = await auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_data')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  },
};
