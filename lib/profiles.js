import { supabase } from './supabase';

export async function getProfileUsername(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data?.username ?? 'Grower';
}