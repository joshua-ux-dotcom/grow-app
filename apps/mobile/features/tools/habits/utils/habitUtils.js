export const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getDateForDayIndex(dayIndex) {
  const today = new Date();
  const todayDow = today.getDay();
  const targetDow = dayIndex === 6 ? 0 : dayIndex + 1;

  const diff = targetDow - todayDow;
  const date = new Date(today);
  date.setDate(today.getDate() + diff);

  return formatLocalDate(date);
}

export function getAllDayIndexes() {
  return [0, 1, 2, 3, 4, 5, 6];
}

export function partitionHabitsByCompletion(habits, completedIds) {
  const safeHabits = Array.isArray(habits) ? habits : [];
  const safeCompletedIds = completedIds instanceof Set ? completedIds : new Set();

  return [
    ...safeHabits.filter(habit => !safeCompletedIds.has(habit.id)),
    ...safeHabits.filter(habit => safeCompletedIds.has(habit.id)),
  ];
}

export function groupHabitOverviewItems(habits, collections, completedIds) {
  const safeHabits = Array.isArray(habits) ? habits : [];
  const safeCollections = Array.isArray(collections) ? collections : [];
  const safeCompletedIds = completedIds instanceof Set ? completedIds : new Set();
  const isCollectionCompleted = collection => (
    collection.progress_total > 0
    && collection.progress_completed === collection.progress_total
  );

  return {
    openCollections: safeCollections.filter(collection => !isCollectionCompleted(collection)),
    openHabits: safeHabits.filter(habit => !safeCompletedIds.has(habit.id)),
    completedCollections: safeCollections.filter(isCollectionCompleted),
    completedHabits: safeHabits.filter(habit => safeCompletedIds.has(habit.id)),
  };
}
