import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getHabits,
  getCompletionsForDate,
  toggleCompletion,
  deleteHabit,
  addHabit,
} from '../services/habits';

import { getDateForDayIndex } from '../utils/habitUtils';

export function useHabits(selectedDay) {
  const [habits, setHabits] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadHabits = useCallback(async () => {
    setLoadError(null);

    try {
      const data = await getHabits();
      setHabits(data);
    } catch (e) {
      setLoadError('Gewohnheiten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCompletions = useCallback(async () => {
    const date = getDateForDayIndex(selectedDay);

    try {
      const ids = await getCompletionsForDate(date);
      setCompletedIds(new Set(ids));
    } catch (e) {
      setActionError('Fortschritt konnte nicht geladen werden.');
    }
  }, [selectedDay]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  const visibleHabits = useMemo(
    () => habits.filter(habit => habit.days.includes(selectedDay)),
    [habits, selectedDay]
  );

  const completedCount = useMemo(
    () => visibleHabits.filter(habit => completedIds.has(habit.id)).length,
    [visibleHabits, completedIds]
  );

  const total = visibleHabits.length;
  const progress = total === 0 ? 0 : completedCount / total;

  const toggle = useCallback(async (id) => {
    const date = getDateForDayIndex(selectedDay);
    const isDone = completedIds.has(id);

    setCompletedIds(prev => {
      const next = new Set(prev);
      isDone ? next.delete(id) : next.add(id);
      return next;
    });

    try {
      await toggleCompletion(id, date, !isDone);
    } catch (e) {
      setActionError('Änderung konnte nicht gespeichert werden.');

      setCompletedIds(prev => {
        const next = new Set(prev);
        isDone ? next.add(id) : next.delete(id);
        return next;
      });
    }
  }, [selectedDay, completedIds]);

  const remove = useCallback(async (id) => {
    setHabits(prev => prev.filter(habit => habit.id !== id));

    try {
      await deleteHabit(id);
    } catch (e) {
      setActionError('Gewohnheit konnte nicht gelöscht werden.');
      loadHabits();
    }
  }, [loadHabits]);

  const add = useCallback(async (name, days) => {
    const newHabit = await addHabit(name, days);
    setHabits(prev => [...prev, newHabit]);
  }, []);

  return {
    habits,
    visibleHabits,
    completedIds,
    loading,
    loadError,
    actionError,
    completedCount,
    total,
    progress,
    loadHabits,
    loadCompletions,
    toggle,
    remove,
    add,
  };
}