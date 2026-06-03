import { supabase } from '@/lib/supabase';
import type { LightRow, LightStatus } from '@/types/database';

const lightsTable = () => {
  const client = supabase;

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  return client.from('lights');
};

export async function fetchLights() {
  const { data, error } = await lightsTable()
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function createLight(name: string) {
  const { data, error } = await lightsTable()
    .insert({ name, status: 'yellow' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateLightStatus(id: string, status: LightStatus) {
  const { data, error } = await lightsTable().update({ status }).eq('id', id).select('*').single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteLight(id: string) {
  const { error } = await lightsTable().delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export function subscribeToLightChanges(onChange: () => void) {
  const client = supabase;

  if (!client) {
    return () => {};
  }

  const channel = client
    .channel('lights-db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lights',
      },
      onChange,
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export function toUserFacingError(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
    return 'That light already exists.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while saving the lights.';
}

export type { LightRow, LightStatus };
