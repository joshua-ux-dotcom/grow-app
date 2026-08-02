import { Dimensions } from 'react-native';
import { s, sv } from '../../../../constants/layout';

export const SCREEN_WIDTH = Dimensions.get('window').width;

// 30 Minuten = 28px.
// Dadurch sind ca. 12 Stunden gleichzeitig sichtbar.
export const SLOT_HEIGHT = sv(28);

export const TIME_LABEL_WIDTH = s(58);
export const TOTAL_SLOTS = 48;
export const MINUTES_PER_SLOT = 30;
export const DAY_MINUTES = 24 * 60;

export const EVENT_COLORS = [
  { key: 'gold', label: 'Gold', value: '#D4AF37' },
  { key: 'blue', label: 'Blau', value: '#4A90E2' },
  { key: 'green', label: 'Grün', value: '#2ECC71' },
  { key: 'red', label: 'Rot', value: '#FF6B6B' },
  { key: 'purple', label: 'Lila', value: '#9B59B6' },
  { key: 'orange', label: 'Orange', value: '#F39C12' },
];

export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export const DAY_NAMES_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const DAY_NAMES_LONG = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag',
];

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parseDateString(dateStr) {
  if (typeof dateStr !== 'string') return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return null;
  if (day < 1 || day > getDaysInMonth(year, month)) return null;

  return { year, month, day };
}

function formatDateParts({ year, month, day }) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function datePartsToOrdinal({ year, month, day }) {
  const adjustedYear = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(adjustedYear / 400);
  const yearOfEra = adjustedYear - era * 400;
  const adjustedMonth = month + (month > 2 ? -3 : 9);
  const dayOfYear = Math.floor((153 * adjustedMonth + 2) / 5) + day - 1;

  return era * 146097
    + yearOfEra * 365
    + Math.floor(yearOfEra / 4)
    - Math.floor(yearOfEra / 100)
    + dayOfYear;
}

export function isValidDateString(dateStr) {
  return parseDateString(dateStr) !== null;
}

export function addCalendarDays(dateStr, amount) {
  const parts = parseDateString(dateStr);
  if (!parts || !Number.isInteger(amount)) return null;

  const next = { ...parts };
  const direction = Math.sign(amount);
  let remaining = Math.abs(amount);

  while (remaining > 0) {
    next.day += direction;

    if (next.day > getDaysInMonth(next.year, next.month)) {
      next.day = 1;
      next.month += 1;
      if (next.month > 12) {
        next.month = 1;
        next.year += 1;
      }
    } else if (next.day < 1) {
      next.month -= 1;
      if (next.month < 1) {
        next.month = 12;
        next.year -= 1;
      }
      if (next.year < 1) return null;
      next.day = getDaysInMonth(next.year, next.month);
    }

    if (next.year > 9999) return null;
    remaining -= 1;
  }

  return formatDateParts(next);
}

export function getEffectiveEventEndDate(event) {
  if (!event || !isValidDateString(event.date)) return null;
  return event.end_date == null ? event.date : event.end_date;
}

export function getInclusiveDayCount(startDate, endDate) {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  if (!start || !end) return null;

  const difference = datePartsToOrdinal(end) - datePartsToOrdinal(start);
  return difference < 0 ? null : difference + 1;
}

export function getEventInterval(event) {
  const startDate = event?.date;
  const endDate = getEffectiveEventEndDate(event);
  const dayCount = getInclusiveDayCount(startDate, endDate);
  if (dayCount === null) return null;

  return {
    startDate,
    endDate,
    dayCount,
    type: dayCount === 1 ? 'single' : 'multi',
  };
}

export function eventOverlapsDate(event, dateStr) {
  const interval = getEventInterval(event);
  if (!interval || !isValidDateString(dateStr)) return false;
  return interval.startDate <= dateStr && dateStr <= interval.endDate;
}

export function eventOverlapsMonth(event, year, monthIndex) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) return false;
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return false;

  const interval = getEventInterval(event);
  if (!interval) return false;

  const month = monthIndex + 1;
  const monthStart = formatDateParts({ year, month, day: 1 });
  const monthEnd = formatDateParts({ year, month, day: getDaysInMonth(year, month) });
  return interval.startDate <= monthEnd && interval.endDate >= monthStart;
}

export function getEventSpanType(event) {
  return getEventInterval(event)?.type ?? null;
}

export function getEventSegment(event, selectedDate) {
  const interval = getEventInterval(event);
  if (!interval || interval.type !== 'multi' || !eventOverlapsDate(event, selectedDate)) return null;
  if (selectedDate === interval.startDate) return 'start';
  if (selectedDate === interval.endDate) return 'end';
  return 'middle';
}

export function buildMultiDayEventViewModel(event, selectedDate) {
  if (!event?.id) return null;

  const interval = getEventInterval(event);
  const segment = getEventSegment(event, selectedDate);
  if (!interval || !segment) return null;

  const dayIndex = getInclusiveDayCount(interval.startDate, selectedDate);
  if (dayIndex === null) return null;

  return {
    eventId: event.id,
    title: event.title,
    color: event.color,
    startDate: interval.startDate,
    endDate: interval.endDate,
    startTime: event.start_time,
    endTime: event.end_time,
    selectedDate,
    segment,
    dayIndex,
    totalDays: interval.dayCount,
  };
}

export function getMonthEventDateMarkers(events, year, monthIndex) {
  if (!Array.isArray(events)) return [];
  if (!Number.isInteger(year) || year < 1 || year > 9999) return [];
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return [];

  const month = monthIndex + 1;
  const monthStart = formatDateParts({ year, month, day: 1 });
  const monthEnd = formatDateParts({ year, month, day: getDaysInMonth(year, month) });
  const markers = new Set();

  events.forEach(event => {
    const interval = getEventInterval(event);
    if (!interval || !eventOverlapsMonth(event, year, monthIndex)) return;

    let current = interval.startDate < monthStart ? monthStart : interval.startDate;
    const last = interval.endDate > monthEnd ? monthEnd : interval.endDate;

    while (current && current <= last) {
      markers.add(current);
      current = addCalendarDays(current, 1);
    }
  });

  return [...markers].sort();
}

export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

export function minutesToTime(totalMins) {
  const capped = Math.max(0, Math.min(totalMins, DAY_MINUTES - 1));
  const h = Math.floor(capped / 60);
  const m = capped % 60;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMinutes(time) {
  if (!time) return 0;

  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

export function slotToTime(slot) {
  return minutesToTime(slot * MINUTES_PER_SLOT);
}

export function slotToMinutes(slot) {
  return Math.max(0, Math.min(slot * MINUTES_PER_SLOT, DAY_MINUTES - 1));
}

export function dateToDayMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function dayMinutesToDate(minutes) {
  const safeMinutes = Math.max(0, Math.min(minutes ?? 0, DAY_MINUTES - 1));
  const date = new Date();

  date.setHours(Math.floor(safeMinutes / 60));
  date.setMinutes(safeMinutes % 60);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
}

export function formatDurationLabel(totalMinutes) {
  const safeMinutes = Math.max(1, Math.min(totalMinutes, DAY_MINUTES - 1));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours === 0) return `${minutes} Min`;
  if (minutes === 0) return `${hours} Std`;
  return `${hours} Std ${minutes} Min`;
}

export function formatDayHeader(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);

  return `${DAY_NAMES_LONG[date.getDay()]}, ${date.getDate()}. ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function buildCalendarCells(year, month) {
  const first = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();

  let startDow = first.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells = [];

  for (let i = 0; i < startDow; i += 1) cells.push(null);
  for (let day = 1; day <= lastDate; day += 1) cells.push(day);

  return cells;
}

function eventsOverlap(a, b) {
  const aStart = timeToMinutes(a.start_time);
  const aEnd = timeToMinutes(a.end_time);
  const bStart = timeToMinutes(b.start_time);
  const bEnd = timeToMinutes(b.end_time);

  return aStart < bEnd && bStart < aEnd;
}

function buildOverlapGroups(events) {
  const sorted = [...events].sort((a, b) => {
    const startDiff = timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    if (startDiff !== 0) return startDiff;

    return timeToMinutes(a.end_time) - timeToMinutes(b.end_time);
  });

  const groups = [];

  sorted.forEach(event => {
    const start = timeToMinutes(event.start_time);
    const end = timeToMinutes(event.end_time);

    const lastGroup = groups[groups.length - 1];

    if (!lastGroup || start >= lastGroup.maxEnd) {
      groups.push({
        events: [event],
        maxEnd: end,
      });
      return;
    }

    lastGroup.events.push(event);
    lastGroup.maxEnd = Math.max(lastGroup.maxEnd, end);
  });

  return groups;
}

function assignColumns(groupEvents) {
  const columns = [];
  const result = [];

  groupEvents.forEach(event => {
    let columnIndex = columns.findIndex(lastEventInColumn => !eventsOverlap(lastEventInColumn, event));

    if (columnIndex === -1) {
      columnIndex = columns.length;
      columns.push(event);
    } else {
      columns[columnIndex] = event;
    }

    result.push({
      event,
      columnIndex,
    });
  });

  const columnCount = Math.max(columns.length, 1);

  return result.map(item => ({
    ...item.event,
    layout: {
      columnIndex: item.columnIndex,
      columnCount,
    },
  }));
}

export function applyEventOverlapLayout(events) {
  const groups = buildOverlapGroups(events);

  return groups.flatMap(group => assignColumns(group.events));
}
