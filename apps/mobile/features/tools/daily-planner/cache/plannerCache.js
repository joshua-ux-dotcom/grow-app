import {
  eventOverlapsDate,
  eventOverlapsMonth,
  getEventInterval,
  isValidDateString,
} from '../utils/plannerUtils';

const ownerCaches = new Map();

function isValidOwnerId(ownerId) {
  return typeof ownerId === 'string'
    && ownerId.length > 0
    && ownerId.trim() === ownerId;
}

function isValidMonth(year, zeroBasedMonth) {
  return Number.isInteger(year)
    && year >= 1
    && year <= 9999
    && Number.isInteger(zeroBasedMonth)
    && zeroBasedMonth >= 0
    && zeroBasedMonth <= 11;
}

function getOwnerCache(ownerId, { create = false } = {}) {
  if (!isValidOwnerId(ownerId)) return null;

  const existing = ownerCaches.get(ownerId);
  if (existing || !create) return existing ?? null;

  const cache = {
    days: new Map(),
    months: new Map(),
  };
  ownerCaches.set(ownerId, cache);
  return cache;
}

function monthKey(year, zeroBasedMonth) {
  return `${year}:${zeroBasedMonth}`;
}

export function getPlannerDayCache(ownerId, date) {
  if (!isValidDateString(date)) return null;
  const cache = getOwnerCache(ownerId);
  return cache?.days.has(date) ? cache.days.get(date) : null;
}

export function setPlannerDayCache(ownerId, date, data) {
  if (!isValidDateString(date)) return;
  const cache = getOwnerCache(ownerId, { create: true });
  if (!cache) return;
  cache.days.set(date, data);
}

export function getPlannerMonthCache(ownerId, year, zeroBasedMonth) {
  if (!isValidMonth(year, zeroBasedMonth)) return null;
  const cache = getOwnerCache(ownerId);
  const key = monthKey(year, zeroBasedMonth);
  return cache?.months.has(key) ? cache.months.get(key).data : null;
}

export function setPlannerMonthCache(ownerId, year, zeroBasedMonth, data) {
  if (!isValidMonth(year, zeroBasedMonth)) return;
  const cache = getOwnerCache(ownerId, { create: true });
  if (!cache) return;
  cache.months.set(monthKey(year, zeroBasedMonth), {
    year,
    zeroBasedMonth,
    data,
  });
}

export function clearPlannerOwnerCache(ownerId) {
  if (!isValidOwnerId(ownerId)) return;
  ownerCaches.delete(ownerId);
}

export function invalidatePlannerEventCaches(ownerId, events) {
  const cache = getOwnerCache(ownerId);
  if (!cache) return;

  const candidates = (Array.isArray(events) ? events : [events])
    .filter(event => getEventInterval(event) !== null);
  if (candidates.length === 0) return;

  for (const date of cache.days.keys()) {
    if (candidates.some(event => eventOverlapsDate(event, date))) {
      cache.days.delete(date);
    }
  }

  for (const [key, entry] of cache.months.entries()) {
    if (candidates.some(event => eventOverlapsMonth(event, entry.year, entry.zeroBasedMonth))) {
      cache.months.delete(key);
    }
  }
}
