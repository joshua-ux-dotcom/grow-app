import { Dimensions } from 'react-native';
import { s, sv } from '../../../constants/layout';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SLOT_HEIGHT = sv(48);
export const TIME_LABEL_WIDTH = s(58);
export const TOTAL_SLOTS = 48;

export const DURATIONS = [
  { label: '30 Min', minutes: 30 },
  { label: '1 Std', minutes: 60 },
  { label: '1,5 Std', minutes: 90 },
  { label: '2 Std', minutes: 120 },
  { label: '3 Std', minutes: 180 },
];

export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export const DAY_NAMES_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const DAY_NAMES_LONG = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag',
];

export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

export function slotToTime(slot) {
  const h = Math.floor(slot / 2);
  const m = (slot % 2) * 30;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function minutesToTime(totalMins) {
  const capped = Math.min(totalMins, 24 * 60 - 1);

  return `${String(Math.floor(capped / 60)).padStart(2, '0')}:${String(capped % 60).padStart(2, '0')}`;
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