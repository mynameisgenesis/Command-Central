import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

const authClient = () => {
  const client = supabase;

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  return client.auth;
};

export async function getInitialSession() {
  const { data, error } = await authClient().getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export function subscribeToAuthChanges(onChange: (session: Session | null) => void) {
  if (!supabase) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session);
  });

  return () => {
    subscription.unsubscribe();
  };
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await authClient().signInWithPassword({ email, password });

  if (error) {
    throw error;
  }
}

export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await authClient().signUp({ email, password });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signOut() {
  const { error } = await authClient().signOut();

  if (error) {
    throw error;
  }
}
