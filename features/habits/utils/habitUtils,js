export const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

export function getDateForDayIndex(dayIndex) {
  const today = new Date();
  const todayDow = today.getDay();
  const targetDow = dayIndex === 6 ? 0 : dayIndex + 1;

  const diff = targetDow - todayDow;
  const date = new Date(today);
  date.setDate(today.getDate() + diff);

  return date.toISOString().split('T')[0];
}

export function getAllDayIndexes() {
  return [0, 1, 2, 3, 4, 5, 6];
}