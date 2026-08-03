import { supabase } from '../../../../services/supabaseClient'
import { getCurrentUserId } from '../../../../services/authUser';
import { addCalendarDays, isValidDateString } from '../utils/plannerUtils';

function isValidTimeString(time) {
  return typeof time === 'string' && /^\d{2}:\d{2}$/.test(time);
}

function isValidEventId(id) {
  return typeof id === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function normalizeEndDate(date, endDate) {
  if (endDate == null || endDate === date) return null;
  if (!isValidDateString(endDate)) throw new Error('Ungültiges Enddatum.');
  if (endDate < date) throw new Error('Enddatum darf nicht vor dem Startdatum liegen.');
  return endDate;
}

export function normalizePlannerEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return null;

  return {
    ...event,
    end_date: event.end_date == null || event.end_date === event.date
      ? null
      : event.end_date,
  };
}

function normalizePlannerEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.map(normalizePlannerEvent).filter(Boolean);
}

function buildOverlapFilter(rangeStart) {
  return `end_date.gte.${rangeStart},and(end_date.is.null,date.gte.${rangeStart})`;
}

export async function getEventsForDate(date) {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  if (!isValidDateString(date)) return [];

  const { data, error } = await supabase
    .from('daily_planner_events')
    .select('*')
    .eq('user_id', userId)
    .lte('date', date)
    .or(buildOverlapFilter(date))
    .order('start_time', { ascending: true });

  if (error) throw error;
  return normalizePlannerEvents(data);
}

export async function getEventsForMonth(year, month) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const safeYear = Number(year);
  const safeMonth = Number(month);
  if (!Number.isInteger(safeYear) || !Number.isInteger(safeMonth) || safeMonth < 1 || safeMonth > 12) return [];

  const mm = String(safeMonth).padStart(2, '0');
  const startDate = `${String(safeYear).padStart(4, '0')}-${mm}-01`;
  if (!isValidDateString(startDate)) return [];

  const nextMonthYear = safeMonth === 12 ? safeYear + 1 : safeYear;
  const nextMonth = safeMonth === 12 ? 1 : safeMonth + 1;
  const nextMonthStart = `${String(nextMonthYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`;
  const endDate = addCalendarDays(nextMonthStart, -1);
  if (!endDate) return [];

  const { data, error } = await supabase
    .from('daily_planner_events')
    .select('id,date,end_date')
    .eq('user_id', userId)
    .lte('date', endDate)
    .or(buildOverlapFilter(startDate));

  if (error) throw error;
  return normalizePlannerEvents(data);
}

export async function addEvent({ date, endDate = null, startTime, endTime, title, color }) {
  const safeTitle = typeof title === 'string' ? title.trim() : '';
  if (!safeTitle) throw new Error('Titel fehlt.');
  if (!isValidDateString(date)) throw new Error('Ungültiges Datum.');
  if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) throw new Error('Ungültige Uhrzeit.');
  const normalizedEndDate = normalizeEndDate(date, endDate);

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Nicht eingeloggt');

  const { data, error } = await supabase
    .from('daily_planner_events')
    .insert({
      user_id: userId,
      date,
      end_date: normalizedEndDate,
      start_time: startTime,
      end_time: endTime,
      title: safeTitle,
      color: color || '#D4AF37',
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Termin konnte nicht gespeichert werden.');
  return normalizePlannerEvent(data);
}

export async function deleteEvent(id) {
  if (!isValidEventId(id)) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase
    .from('daily_planner_events')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateEvent({ id, date, endDate, startTime, endTime, title, color }) {
  if (!id) throw new Error('Termin fehlt.');

  const safeTitle = typeof title === 'string' ? title.trim() : '';
  if (!safeTitle) throw new Error('Titel fehlt.');
  if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) throw new Error('Ungültige Uhrzeit.');

  const datePayload = {};
  if (date !== undefined) {
    if (!isValidDateString(date)) throw new Error('Ungültiges Datum.');
    datePayload.date = date;
    datePayload.end_date = normalizeEndDate(date, endDate);
  } else if (endDate !== undefined) {
    if (endDate !== null) throw new Error('Startdatum fehlt.');
    datePayload.end_date = null;
  }

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Nicht eingeloggt');

  const { data, error } = await supabase
    .from('daily_planner_events')
    .update({
      start_time: startTime,
      end_time: endTime,
      title: safeTitle,
      color: color || '#D4AF37',
      ...datePayload,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error('Termin konnte nicht aktualisiert werden. Keine passende Zeile gefunden.');
  }

  return normalizePlannerEvent(data);
}
