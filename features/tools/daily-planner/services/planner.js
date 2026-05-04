import { supabase } from '../../../../services/supabaseClient'

async function getCurrentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user?.id ?? null;
}

export async function getEventsForDate(date) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('daily_planner_events')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getEventsForMonth(year, month) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const mm = String(month).padStart(2, '0');
  const startDate = `${year}-${mm}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('daily_planner_events')
    .select('date')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;
  return data;
}

export async function addEvent({ date, startTime, endTime, title }) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Nicht eingeloggt');

  const { data, error } = await supabase
    .from('daily_planner_events')
    .insert({
      user_id: userId,
      date,
      start_time: startTime,
      end_time: endTime,
      title,
      color: '#D4AF37',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('daily_planner_events')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
