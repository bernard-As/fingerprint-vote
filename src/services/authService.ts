// src/services/authService.ts
import { supabase } from '../lib/supabaseClient';
import { AuthError, type User } from '@supabase/supabase-js';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

// Pro-Tip: In a real application, you might differentiate between admin users
// and regular users by checking roles or a custom claim after login.
// For now, we assume any successful login via this function is an admin.
export const loginAdmin = async ({ email, password }: LoginCredentials): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Note: Supabase's `signInWithPassword` returns `data.session` and `data.user`
  // We are primarily interested in `data.user` and any `error`.
  return { user: data.user, error };
};

export const logoutAdmin = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<{ user: User | null; error: AuthError | null }> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        return { user: null, error: sessionError };
    }
    if (!session) {
        return { user: null, error: null };
    }
    // If there's a session, user should be present
    // But good to re-fetch to ensure it's up-to-date or if session is stale.
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    return { user, error: userError };
};