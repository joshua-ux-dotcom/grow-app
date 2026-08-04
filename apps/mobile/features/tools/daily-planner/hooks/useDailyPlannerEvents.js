import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getEventsForMonth,
  getEventsForDate,
  addEvent,
  updateEvent,
  deleteEvent,
} from '../services/planner';
import {
  DAY_MINUTES,
  isValidDateString,
  minutesToTime,
} from '../utils/plannerUtils';
import {
  clearPlannerOwnerCache,
  getPlannerDayCache,
  getPlannerMonthCache,
  invalidatePlannerEventCaches,
  setPlannerDayCache,
  setPlannerMonthCache,
} from '../cache/plannerCache';
import { getCurrentUserId } from '../../../../services/authUser';
import { supabase } from '../../../../services/supabaseClient';

function normalizeEvent(event) {
  if (!event || !event.id || !isValidDateString(event.date)) return null;

  return {
    ...event,
    end_date: event.end_date == null ? null : event.end_date,
    title: typeof event.title === 'string' ? event.title : '',
    start_time: typeof event.start_time === 'string' ? event.start_time : '00:00',
    end_time: typeof event.end_time === 'string' ? event.end_time : '00:30',
    color: event.color || '#D4AF37',
  };
}

function normalizeEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.map(normalizeEvent).filter(Boolean);
}

function sortEvents(events) {
  return normalizeEvents(events).sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export function useDailyPlannerEvents(currentYear, currentMonth, selectedDate) {
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [monthEventDates, setMonthEventDates] = useState(() => new Set());
  const [events, setEvents] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState(null);

  const mountedRef = useRef(true);
  const ownerRef = useRef(null);
  const eventsRef = useRef([]);
  const monthRequestRef = useRef(0);
  const dayRequestRef = useRef(0);
  const pendingActionsRef = useRef(new Set());

  const activateOwner = useCallback((nextOwnerId) => {
    const safeOwnerId = typeof nextOwnerId === 'string' && nextOwnerId ? nextOwnerId : null;
    const previousOwnerId = ownerRef.current;
    if (previousOwnerId === safeOwnerId) return;

    if (previousOwnerId && previousOwnerId !== safeOwnerId) {
      clearPlannerOwnerCache(previousOwnerId);
    }

    ownerRef.current = safeOwnerId;
    monthRequestRef.current += 1;
    dayRequestRef.current += 1;
    pendingActionsRef.current.clear();
    eventsRef.current = [];
    setOwnerUserId(safeOwnerId);
    setMonthEventDates(new Set());
    setEvents([]);
    setDayError(null);
    setDayLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let authSequence = 0;

    const resolveInitialOwner = async () => {
      const sequence = ++authSequence;
      try {
        const userId = await getCurrentUserId();
        if (mountedRef.current && sequence === authSequence) activateOwner(userId);
      } catch {
        if (mountedRef.current && sequence === authSequence) activateOwner(null);
      }
    };

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authSequence += 1;
        if (mountedRef.current) activateOwner(session?.user?.id ?? null);
      }
    );
    resolveInitialOwner();

    return () => {
      mountedRef.current = false;
      authSequence += 1;
      monthRequestRef.current += 1;
      dayRequestRef.current += 1;
      pendingActionsRef.current.clear();
      subscription?.unsubscribe?.();
    };
  }, [activateOwner]);

  const loadMonthEvents = useCallback(async () => {
    const requestOwnerId = ownerRef.current;
    if (!requestOwnerId) return;

    const requestId = ++monthRequestRef.current;
    try {
      const data = normalizeEvents(await getEventsForMonth(currentYear, currentMonth + 1));
      if (
        !mountedRef.current
        || requestId !== monthRequestRef.current
        || ownerRef.current !== requestOwnerId
      ) return;

      setMonthEventDates(new Set(data.map(event => event.date)));
      setPlannerMonthCache(requestOwnerId, currentYear, currentMonth, data);
    } catch {
      // Calendar markers may fail silently.
    }
  }, [currentYear, currentMonth]);

  const loadDayEvents = useCallback(async (dateStr, { silent = false } = {}) => {
    if (!isValidDateString(dateStr)) return;
    const requestOwnerId = ownerRef.current;
    if (!requestOwnerId) return;

    const requestId = ++dayRequestRef.current;
    if (mountedRef.current) {
      if (!silent) setDayLoading(true);
      setDayError(null);
    }

    try {
      const data = sortEvents(await getEventsForDate(dateStr));
      if (
        !mountedRef.current
        || requestId !== dayRequestRef.current
        || ownerRef.current !== requestOwnerId
      ) return;

      eventsRef.current = data;
      setEvents(data);
      setPlannerDayCache(requestOwnerId, dateStr, data);
    } catch {
      if (
        !mountedRef.current
        || requestId !== dayRequestRef.current
        || ownerRef.current !== requestOwnerId
      ) return;
      setDayError('Termine konnten nicht geladen werden.');
    } finally {
      if (
        mountedRef.current
        && requestId === dayRequestRef.current
        && ownerRef.current === requestOwnerId
        && !silent
      ) setDayLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ownerUserId) return;

    const cached = getPlannerMonthCache(ownerUserId, currentYear, currentMonth);
    if (cached != null) {
      const normalized = normalizeEvents(cached);
      setMonthEventDates(new Set(normalized.map(event => event.date)));
    } else {
      setMonthEventDates(new Set());
    }
    loadMonthEvents();
  }, [ownerUserId, currentYear, currentMonth, loadMonthEvents]);

  useEffect(() => {
    if (!ownerUserId || !isValidDateString(selectedDate)) return;

    const cached = getPlannerDayCache(ownerUserId, selectedDate);
    if (cached == null) {
      eventsRef.current = [];
      setEvents([]);
      loadDayEvents(selectedDate);
      return;
    }

    const normalized = sortEvents(cached);
    eventsRef.current = normalized;
    setEvents(normalized);
    loadDayEvents(selectedDate, { silent: true });
  }, [ownerUserId, selectedDate, loadDayEvents]);

  const clearEvents = useCallback(() => {
    if (!mountedRef.current) return;
    dayRequestRef.current += 1;
    eventsRef.current = [];
    setEvents([]);
    setDayError(null);
    setDayLoading(false);
  }, []);

  const requireMutationOwner = useCallback(async () => {
    const mutationOwnerId = ownerRef.current;
    if (!mutationOwnerId) throw new Error('Nicht eingeloggt');

    const currentUserId = await getCurrentUserId();
    if (!currentUserId || currentUserId !== mutationOwnerId) {
      throw new Error('Nicht eingeloggt');
    }
    return mutationOwnerId;
  }, []);

  const refreshVisiblePlanner = useCallback(async (mutationOwnerId) => {
    if (!mountedRef.current || ownerRef.current !== mutationOwnerId) return;

    const requests = [loadMonthEvents()];
    if (isValidDateString(selectedDate)) requests.push(loadDayEvents(selectedDate));
    await Promise.all(requests);
  }, [loadMonthEvents, loadDayEvents, selectedDate]);

  const saveEvent = useCallback(async ({
    editingEventId = null,
    eventDate = selectedDate,
    isMultiDay = false,
    endDate = null,
    isAllDay = false,
    modalTitle,
    modalStartMinutes,
    modalDuration,
    modalColor,
  }) => {
    const safeTitle = typeof modalTitle === 'string' ? modalTitle.trim() : '';
    if (!safeTitle) return null;
    if (!isAllDay && (modalStartMinutes === null || modalStartMinutes === undefined)) return null;
    if (!isValidDateString(eventDate)) return null;
    if (isMultiDay && !isValidDateString(endDate)) return null;
    if (isMultiDay && endDate < eventDate) return null;
    const canonicalEndDate = isMultiDay ? endDate : null;

    let mutationOwnerId;
    try {
      mutationOwnerId = await requireMutationOwner();
    } catch {
      return null;
    }

    const actionKey = editingEventId
      ? `${mutationOwnerId}:update:${editingEventId}`
      : `${mutationOwnerId}:add:${eventDate}:${safeTitle}:${modalStartMinutes}`;
    if (pendingActionsRef.current.has(actionKey)) return null;
    pendingActionsRef.current.add(actionKey);

    const originalEvent = editingEventId
      ? eventsRef.current.find(event => event.id === editingEventId) ?? null
      : null;

    try {
      let startTime;
      let endTime;
      if (isAllDay) {
        startTime = '00:00';
        endTime = '23:59';
      } else {
        const safeStartMinutes = Math.max(0, Math.min(Number(modalStartMinutes), DAY_MINUTES - 1));
        const safeDuration = Math.max(1, Math.min(Number(modalDuration) || 1, DAY_MINUTES - 1));
        const safeEndMinutes = Math.min(safeStartMinutes + safeDuration, DAY_MINUTES - 1);
        startTime = minutesToTime(safeStartMinutes);
        endTime = minutesToTime(safeEndMinutes);
      }

      const savedEvent = normalizeEvent(editingEventId
        ? await updateEvent({
          id: editingEventId,
          date: eventDate,
          endDate: canonicalEndDate,
          startTime,
          endTime,
          title: safeTitle,
          color: modalColor,
          expectedUserId: mutationOwnerId,
        })
        : await addEvent({
          date: eventDate,
          endDate: canonicalEndDate,
          startTime,
          endTime,
          title: safeTitle,
          color: modalColor,
          expectedUserId: mutationOwnerId,
        }));

      if (!savedEvent) return null;
      if (!mountedRef.current || ownerRef.current !== mutationOwnerId) return savedEvent;

      invalidatePlannerEventCaches(
        mutationOwnerId,
        originalEvent ? [originalEvent, savedEvent] : savedEvent,
      );
      await refreshVisiblePlanner(mutationOwnerId);
      return savedEvent;
    } finally {
      pendingActionsRef.current.delete(actionKey);
    }
  }, [selectedDate, requireMutationOwner, refreshVisiblePlanner]);

  const removeEvent = useCallback(async (id) => {
    if (!id) return;

    let mutationOwnerId;
    try {
      mutationOwnerId = await requireMutationOwner();
    } catch {
      return;
    }

    const actionKey = `${mutationOwnerId}:delete:${id}`;
    if (pendingActionsRef.current.has(actionKey)) return;
    pendingActionsRef.current.add(actionKey);
    const originalEvent = eventsRef.current.find(event => event.id === id) ?? null;

    if (mountedRef.current && ownerRef.current === mutationOwnerId) {
      const nextEvents = eventsRef.current.filter(event => event.id !== id);
      eventsRef.current = nextEvents;
      setEvents(nextEvents);
    }

    try {
      await deleteEvent(id, mutationOwnerId);
      if (!mountedRef.current || ownerRef.current !== mutationOwnerId) return;

      if (originalEvent) invalidatePlannerEventCaches(mutationOwnerId, originalEvent);
      await refreshVisiblePlanner(mutationOwnerId);
    } catch {
      if (
        mountedRef.current
        && ownerRef.current === mutationOwnerId
        && isValidDateString(selectedDate)
      ) await loadDayEvents(selectedDate);
    } finally {
      pendingActionsRef.current.delete(actionKey);
    }
  }, [selectedDate, loadDayEvents, requireMutationOwner, refreshVisiblePlanner]);

  return {
    monthEventDates,
    loadMonthEvents,
    events,
    dayLoading,
    dayError,
    loadDayEvents,
    clearEvents,
    saveEvent,
    removeEvent,
  };
}
