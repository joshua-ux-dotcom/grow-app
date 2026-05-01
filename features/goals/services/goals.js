import { supabase } from '../../../services/supabaseClient';

const CATEGORY_MAP = ['monthly', 'yearly', 'lifetime'];

async function getCurrentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user?.id ?? null;
}

export async function getGoals(categoryIndex) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('category', CATEGORY_MAP[categoryIndex])
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addGoal(name, categoryIndex, deadline) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Nicht eingeloggt');

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      name,
      category: CATEGORY_MAP[categoryIndex],
      deadline: deadline || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleGoal(id, completed) {
  const { data, error } = await supabase
    .from('goals')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(id) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}