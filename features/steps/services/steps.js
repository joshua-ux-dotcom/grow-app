import { supabase } from '../../../services/supabaseClient';

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function upsertSteps(steps) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('step_counts')
    .upsert(
      { user_id: userId, date: today, steps, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    );
  if (error) throw error;
}
