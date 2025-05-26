// src/lib/supabaseClient.ts
import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: You might want to type the user profile if you extend it later
export interface UserProfile extends User {
  // Add custom profile fields here if you have them in a 'profiles' table
  full_name?: string;
  avatar_url?: string;
}