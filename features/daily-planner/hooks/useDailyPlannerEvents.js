import { useCallback, useEffect, useState } from 'react';

import {
  getEventsForMonth,
  getEventsForDate,
  addEvent,
  deleteEvent,
} from '../services/planner';

import {
  slotToTime,
  minutesToTime,
} from '../utils/plannerUtils';

export function useDailyPlannerEvents(currentYear, currentMonth, selectedDate) {
  const [monthEventDates, setMonthEventDates] = useState(new Set());
  const [events, setEvents] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMonthEvents() {
      try {
        const data = await getEventsForMonth(currentYear, currentMonth + 1);

        if (!cancelled) {
          setMonthEventDates(new Set(data.map(event => event.date)));
        }
      } catch {
        // Dots may fail silently.
      }
    }

    loadMonthEvents();

    return () => {
      cancelled = true;
    };
  }, [currentYear, currentMonth]);

  const loadDayEvents = useCallback(async (dateStr) => {
    setDayLoading(true);
    setDayError(null);

    try {
      const data = await getEventsForDate(dateStr);
      setEvents(data);
    } catch {
      setDayError('Termine konnten nicht geladen werden.');
    } finally {
      setDayLoading(false);
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const saveEvent = useCallback(async ({
    modalTitle,
    modalSlot,
    modalDuration,
  }) => {
    if (!modalTitle.trim() || modalSlot === null || !selectedDate) return null;

    const startTime = slotToTime(modalSlot);
    const endTime = minutesToTime(modalSlot * 30 + modalDuration);

    const newEvent = await addEvent({
      date: selectedDate,
      startTime,
      endTime,
      title: modalTitle.trim(),
    });

    setEvents(prev =>
      [...prev, newEvent].sort((a, b) => a.start_time.localeCompare(b.start_time))
    );

    setMonthEventDates(prev => new Set([...prev, selectedDate]));

    return newEvent;
  }, [selectedDate]);

  const removeEvent = useCallback(async (id) => {
    setEvents(prev => prev.filter(event => event.id !== id));

    try {
      await deleteEvent(id);
    } catch {
      if (selectedDate) {
        loadDayEvents(selectedDate);
      }
    }
  }, [selectedDate, loadDayEvents]);

  return {
    monthEventDates,
    events,
    dayLoading,
    dayError,
    loadDayEvents,
    clearEvents,
    saveEvent,
    removeEvent,
  };
}