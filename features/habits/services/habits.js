import { supabase } from '../../../services/supabaseClient';

async function getCurrentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user?.id ?? null;
}

export async function getHabits() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addHabit(name, days) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Nicht eingeloggt');

  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: userId, name, days })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteHabit(id) {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Gibt alle habit_ids zurück, die am angegebenen Datum (YYYY-MM-DD) abgehakt sind
export async function getCompletionsForDate(date) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('habit_completions')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('completed_date', date);

  if (error) throw error;
  return data.map(r => r.habit_id);
}

// isCompleted=true → Eintrag anlegen, false → löschen
export async function toggleCompletion(habitId, date, isCompleted) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Nicht eingeloggt');

  if (isCompleted) {
    const { error } = await supabase
      .from('habit_completions')
      .insert({ habit_id: habitId, user_id: userId, completed_date: date });
    if (error && error.code !== '23505') throw error; // 23505 = unique violation (bereits vorhanden)
  } else {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('completed_date', date);
    if (error) throw error;
  }
}