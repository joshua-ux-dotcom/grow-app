const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { transformFileSync } = require('@babel/core');
const transformModulesCommonJs = require('@babel/plugin-transform-modules-commonjs');

const filename = path.resolve(__dirname, './useDailyPlannerEvents.js');
const source = fs.readFileSync(filename, 'utf8');
const screenSource = fs.readFileSync(
  path.resolve(__dirname, '../screens/DailyPlannerDayScreen.jsx'),
  'utf8',
);
const modalSource = fs.readFileSync(
  path.resolve(__dirname, '../components/AddEventModal.jsx'),
  'utf8',
);

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createReactHarness() {
  const slots = [];
  let cursor = 0;
  let dirty = false;
  let pendingEffects = [];
  let hook;
  let args;
  let result;

  const sameDeps = (left, right) => left
    && right
    && left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));

  const react = {
    useState(initialValue) {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = {
          value: typeof initialValue === 'function' ? initialValue() : initialValue,
        };
      }
      const setValue = nextValue => {
        const next = typeof nextValue === 'function'
          ? nextValue(slots[index].value)
          : nextValue;
        if (!Object.is(next, slots[index].value)) {
          slots[index].value = next;
          dirty = true;
        }
      };
      return [slots[index].value, setValue];
    },
    useRef(initialValue) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initialValue };
      return slots[index];
    },
    useCallback(callback, dependencies) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].dependencies, dependencies)) {
        slots[index] = { callback, dependencies };
      }
      return slots[index].callback;
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !sameDeps(previous.dependencies, dependencies)) {
        pendingEffects.push({ effect, index, dependencies, cleanup: previous?.cleanup });
      }
    },
  };

  function render(nextHook = hook, nextArgs = args) {
    hook = nextHook;
    args = nextArgs;
    cursor = 0;
    pendingEffects = [];
    dirty = false;
    result = hook(...args);
    for (const pending of pendingEffects) {
      pending.cleanup?.();
      const cleanup = pending.effect();
      slots[pending.index] = { dependencies: pending.dependencies, cleanup };
    }
    return result;
  }

  async function settle() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await Promise.resolve();
      await Promise.resolve();
      if (!dirty) break;
      render();
    }
    return result;
  }

  return { react, render, settle, get result() { return result; } };
}

function loadHookRuntime({
  dayCache = null,
  monthCache = null,
  addEventImpl = async () => null,
  updateEventImpl = async () => null,
} = {}) {
  const harness = createReactHarness();
  const dayRequests = [];
  const monthRequests = [];
  const cacheCalls = [];
  const mutationCalls = [];
  let authCalls = 0;
  let authListener;
  let currentOwner = 'owner-a';
  let activeDayCache = dayCache;
  let activeMonthCache = monthCache;

  const plannerUtils = (() => {
    const utilityFilename = path.resolve(__dirname, '../utils/plannerUtils.js');
    const utilityCode = transformFileSync(utilityFilename, {
      babelrc: false,
      configFile: false,
      plugins: [transformModulesCommonJs],
    }).code;
    const utilityModule = { exports: {} };
    const utilityRequire = request => {
      if (request === 'react-native') return { Dimensions: { get: () => ({ width: 390 }) } };
      if (request === '../../../../constants/layout') return { s: value => value, sv: value => value };
      return require(request);
    };
    new Function('require', 'module', 'exports', utilityCode)(
      utilityRequire, utilityModule, utilityModule.exports
    );
    return utilityModule.exports;
  })();

  const mocks = {
    react: harness.react,
    '../utils/plannerUtils': plannerUtils,
    '../services/planner': {
      getEventsForDate: date => {
        const request = deferred();
        dayRequests.push({ date, request });
        return request.promise;
      },
      getEventsForMonth: (year, month) => {
        const request = deferred();
        monthRequests.push({ year, month, request });
        return request.promise;
      },
      addEvent: payload => {
        mutationCalls.push(['add', payload]);
        return addEventImpl(payload, mutationCalls.length);
      },
      updateEvent: async payload => {
        mutationCalls.push(['update', payload]);
        return updateEventImpl(payload);
      },
      deleteEvent: async (id, expectedUserId) => {
        mutationCalls.push(['delete', id, expectedUserId]);
      },
    },
    '../cache/plannerCache': {
      getPlannerDayCache: (ownerId, date) => {
        cacheCalls.push(['getDay', ownerId, date]);
        return activeDayCache;
      },
      getPlannerMonthCache: (ownerId, year, month) => {
        cacheCalls.push(['getMonth', ownerId, year, month]);
        return activeMonthCache;
      },
      setPlannerDayCache: (...callArgs) => cacheCalls.push(['setDay', ...callArgs]),
      setPlannerMonthCache: (...callArgs) => cacheCalls.push(['setMonth', ...callArgs]),
      clearPlannerOwnerCache: ownerId => cacheCalls.push(['clearOwner', ownerId]),
      invalidatePlannerEventCaches: (...callArgs) => cacheCalls.push(['invalidate', ...callArgs]),
    },
    '../../../../services/authUser': {
      getCurrentUserId: async () => {
        authCalls += 1;
        return currentOwner;
      },
    },
    '../../../../services/supabaseClient': {
      supabase: {
        auth: {
          onAuthStateChange: listener => {
            authListener = listener;
            return { data: { subscription: { unsubscribe() {} } } };
          },
        },
      },
    },
  };
  const code = transformFileSync(filename, {
    babelrc: false,
    configFile: false,
    plugins: [transformModulesCommonJs],
  }).code;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    request => mocks[request] ?? require(request), module, module.exports
  );

  return {
    ...module.exports,
    harness,
    cacheCalls,
    dayRequests,
    monthRequests,
    mutationCalls,
    get authCalls() { return authCalls; },
    setCaches(day, month) {
      activeDayCache = day;
      activeMonthCache = month;
    },
    switchOwner(ownerId) {
      currentOwner = ownerId;
      authListener?.('SIGNED_IN', ownerId ? { user: { id: ownerId } } : null);
    },
  };
}

test('cache miss starts day and month requests only after owner verification', async () => {
  const runtime = loadHookRuntime();
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  assert.deepEqual(runtime.cacheCalls, []);
  assert.equal(runtime.dayRequests.length, 0);
  assert.equal(runtime.monthRequests.length, 0);

  await runtime.harness.settle();
  assert.ok(runtime.cacheCalls.some(call => call[0] === 'getDay' && call[1] === 'owner-a'));
  assert.ok(runtime.cacheCalls.some(call => call[0] === 'getMonth' && call[1] === 'owner-a'));
  assert.equal(runtime.dayRequests.length, 1);
  assert.equal(runtime.monthRequests.length, 1);
  assert.deepEqual(runtime.harness.result.events, []);
  assert.equal(runtime.harness.result.monthEventDates.size, 0);
});

test('cache hit is visible immediately and revalidates in the background', async () => {
  const cachedEvent = {
    id: 'cached', date: '2026-08-03', end_date: null,
    start_time: '09:00', end_time: '10:00', title: 'Cached', color: '#fff',
  };
  const runtime = loadHookRuntime({ dayCache: [cachedEvent], monthCache: [cachedEvent] });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();

  assert.deepEqual(runtime.harness.result.events, [cachedEvent]);
  assert.deepEqual([...runtime.harness.result.monthEventDates], ['2026-08-03']);
  assert.equal(runtime.dayRequests.length, 1);
  assert.equal(runtime.monthRequests.length, 1);
});

test('late response from the previous owner writes neither state nor cache', async () => {
  const runtime = loadHookRuntime();
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();
  const oldDayRequest = runtime.dayRequests[0].request;
  const oldMonthRequest = runtime.monthRequests[0].request;

  runtime.switchOwner('owner-b');
  await runtime.harness.settle();
  runtime.cacheCalls.length = 0;
  const staleEvent = {
    id: 'stale', date: '2026-08-03', end_date: null,
    start_time: '09:00', end_time: '10:00', title: 'Stale', color: '#fff',
  };
  oldDayRequest.resolve([staleEvent]);
  oldMonthRequest.resolve([staleEvent]);
  await runtime.harness.settle();

  assert.equal(runtime.harness.result.events.some(event => event.id === 'stale'), false);
  assert.equal(runtime.cacheCalls.some(call => call[0] === 'setDay' || call[0] === 'setMonth'), false);
});

test('late mutation after owner switch writes no state or cache and carries the start owner', async () => {
  const mutation = deferred();
  const runtime = loadHookRuntime({ addEventImpl: () => mutation.promise });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();

  const savePromise = runtime.harness.result.saveEvent({
    modalTitle: 'Termin', modalStartMinutes: 540, modalDuration: 60, modalColor: '#fff',
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(runtime.mutationCalls[0][1].expectedUserId, 'owner-a');

  runtime.switchOwner('owner-b');
  await runtime.harness.settle();
  runtime.cacheCalls.length = 0;
  mutation.resolve({
    id: 'created-a', user_id: 'owner-a', date: '2026-08-03', end_date: null,
    start_time: '09:00', end_time: '10:00', title: 'Termin', color: '#fff',
  });
  await savePromise;
  await runtime.harness.settle();

  assert.equal(runtime.harness.result.events.some(event => event.id === 'created-a'), false);
  assert.equal(runtime.cacheCalls.some(call => call[0] === 'invalidate' || call[0] === 'setDay' || call[0] === 'setMonth'), false);
});

test('old owner finally cannot release an equal pending action for the new owner', async () => {
  const mutations = [deferred(), deferred()];
  const runtime = loadHookRuntime({
    addEventImpl: (_payload, callNumber) => mutations[callNumber - 1].promise,
  });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();
  const input = {
    modalTitle: 'Gleich', modalStartMinutes: 540, modalDuration: 60, modalColor: '#fff',
  };

  const ownerAPromise = runtime.harness.result.saveEvent(input);
  await Promise.resolve();
  await Promise.resolve();
  runtime.switchOwner('owner-b');
  await runtime.harness.settle();
  runtime.harness.result.saveEvent(input);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(runtime.mutationCalls.length, 2);

  mutations[0].resolve({
    id: 'created-a', date: '2026-08-03', end_date: null,
    start_time: '09:00', end_time: '10:00', title: 'Gleich', color: '#fff',
  });
  await ownerAPromise;
  const duplicateResult = await runtime.harness.result.saveEvent(input);
  assert.equal(duplicateResult, null);
  assert.equal(runtime.mutationCalls.length, 2);
});

test('failed mutation does not invalidate planner cache', async () => {
  const runtime = loadHookRuntime({
    addEventImpl: async () => { throw new Error('save failed'); },
  });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();
  runtime.cacheCalls.length = 0;

  await assert.rejects(runtime.harness.result.saveEvent({
    modalTitle: 'Fehler', modalStartMinutes: 540, modalDuration: 60, modalColor: '#fff',
  }), /save failed/);

  assert.equal(runtime.cacheCalls.some(call => call[0] === 'invalidate'), false);
});

test('hook forwards the verified owner to update and delete services', async () => {
  const cachedEvent = {
    id: '11111111-2222-4333-8444-555555555555',
    date: '2026-08-03', end_date: null,
    start_time: '09:00', end_time: '10:00', title: 'Cached', color: '#fff',
  };
  const runtime = loadHookRuntime({ dayCache: [cachedEvent] });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();

  await runtime.harness.result.saveEvent({
    editingEventId: cachedEvent.id,
    modalTitle: 'Update', modalStartMinutes: 540, modalDuration: 60, modalColor: '#fff',
  });
  assert.equal(runtime.mutationCalls.find(call => call[0] === 'update')[1].expectedUserId, 'owner-a');

  runtime.harness.result.removeEvent(cachedEvent.id);
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(
    runtime.mutationCalls.find(call => call[0] === 'delete'),
    ['delete', cachedEvent.id, 'owner-a'],
  );
});

test('create forwards start date, null end date and verified owner by default', async () => {
  const runtime = loadHookRuntime({
    addEventImpl: async payload => ({
      id: 'created', date: payload.date, end_date: payload.endDate,
      start_time: payload.startTime, end_time: payload.endTime,
      title: payload.title, color: payload.color,
    }),
  });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();

  const savePromise = runtime.harness.result.saveEvent({
    eventDate: '2026-08-03', isMultiDay: false, endDate: '2026-08-09',
    modalTitle: 'Single', modalStartMinutes: 540, modalDuration: 60, modalColor: '#fff',
  });
  await Promise.resolve();
  await Promise.resolve();

  const payload = runtime.mutationCalls.find(call => call[0] === 'add')[1];
  assert.equal(payload.date, '2026-08-03');
  assert.equal(payload.endDate, null);
  assert.equal(payload.expectedUserId, 'owner-a');
  // Avoid waiting for the intentionally deferred refresh requests.
  runtime.switchOwner(null);
  await savePromise;
});

test('equal multi-day end is allowed and forwarded for service canonicalization', async () => {
  const runtime = loadHookRuntime();
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();

  await runtime.harness.result.saveEvent({
    eventDate: '2026-08-03', isMultiDay: true, endDate: '2026-08-03',
    modalTitle: 'Equal', modalStartMinutes: 540, modalDuration: 60, modalColor: '#fff',
  });
  const payload = runtime.mutationCalls.find(call => call[0] === 'add')[1];
  assert.equal(payload.endDate, '2026-08-03');
  assert.equal(payload.expectedUserId, 'owner-a');
});

test('edit forwards original event start and end dates and can explicitly clear the end', async () => {
  const cachedEvent = {
    id: 'event-multi', date: '2026-08-01', end_date: '2026-08-05',
    start_time: '09:00', end_time: '10:00', title: 'Reise', color: '#fff',
  };
  const runtime = loadHookRuntime({ dayCache: [cachedEvent] });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();

  await runtime.harness.result.saveEvent({
    editingEventId: cachedEvent.id,
    eventDate: cachedEvent.date,
    isMultiDay: false,
    endDate: cachedEvent.end_date,
    modalTitle: 'Reise', modalStartMinutes: 540, modalDuration: 60, modalColor: '#fff',
  });
  const payload = runtime.mutationCalls.find(call => call[0] === 'update')[1];
  assert.equal(payload.date, '2026-08-01');
  assert.equal(payload.endDate, null);
  assert.equal(payload.expectedUserId, 'owner-a');
});

test('invalid form dates stop before auth, service and cache invalidation', async () => {
  const runtime = loadHookRuntime();
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();
  const authCallsBefore = runtime.authCalls;
  runtime.cacheCalls.length = 0;

  for (const input of [
    { eventDate: '2026-02-30', isMultiDay: false, endDate: null },
    { eventDate: '2026-08-03', isMultiDay: true, endDate: 'invalid' },
    { eventDate: '2026-08-03', isMultiDay: true, endDate: '2026-08-02' },
  ]) {
    const result = await runtime.harness.result.saveEvent({
      ...input,
      modalTitle: 'Invalid', modalStartMinutes: 540, modalDuration: 60, modalColor: '#fff',
    });
    assert.equal(result, null);
  }

  assert.equal(runtime.authCalls, authCallsBefore);
  assert.equal(runtime.mutationCalls.length, 0);
  assert.equal(runtime.cacheCalls.some(call => call[0] === 'invalidate'), false);
});

test('screen initializes create as single-day and edit from original event dates', () => {
  assert.match(screenSource, /useState\(false\).*modalIsMultiDay|modalIsMultiDay, setModalIsMultiDay\] = useState\(false\)/);
  assert.match(screenSource, /setModalEventDate\(selectedDate\)[\s\S]*setModalIsMultiDay\(false\)/);
  assert.match(screenSource, /const eventDate = event\.date/);
  assert.match(screenSource, /event\.end_date > eventDate/);
  assert.match(screenSource, /setModalEndDate\(isMultiDay \? event\.end_date : eventDate\)/);
  assert.match(screenSource, /eventDate: modalEventDate[\s\S]*endDate: modalIsMultiDay \? modalEndDate : null/);
});

test('modal exposes an accessible checkbox and a bounded local date picker', () => {
  assert.match(modalSource, /accessibilityRole="checkbox"/);
  assert.match(modalSource, /accessibilityState=\{\{ checked: modalIsMultiDay \}\}/);
  assert.match(modalSource, /minimumDate=\{startDateValue\}/);
  assert.match(modalSource, /event\.type !== 'dismissed'/);
  assert.match(modalSource, /setModalShowEndDatePicker\(false\)/);
  assert.doesNotMatch(modalSource, /toISOString|setUTC|Date\.UTC/);
});

test('screen initializes create without all-day and derives edit state from an exact 00:00-23:59 match', () => {
  assert.match(screenSource, /modalIsAllDay, setModalIsAllDay\] = useState\(false\)/);
  assert.match(screenSource, /const isAllDay = event\.start_time === '00:00' && event\.end_time === '23:59';/);
  assert.match(screenSource, /setModalIsAllDay\(isAllDay\)/);
  assert.match(screenSource, /setModalIsAllDay\(false\);\s*\n\s*previousModalTimeRef\.current = null;/);
});

test('toggling all-day off restores prior normal values or falls back to a safe default', () => {
  assert.match(screenSource, /const toggleModalAllDay = useCallback\(\(\) => \{/);
  assert.match(screenSource, /previousModalTimeRef\.current = \{ startMinutes: modalStartMinutes, duration: modalDuration \};/);
  assert.match(screenSource, /const restoredStart = previous \? previous\.startMinutes : 16 \* 60;/);
  assert.match(screenSource, /const restoredDuration = previous \? previous\.duration : 60;/);
});

test('handleSave allows saving without a chosen start minute while all-day and forwards isAllDay', () => {
  assert.match(screenSource, /if \(!modalTitle\.trim\(\) \|\| \(!modalIsAllDay && modalStartMinutes === null\)\) return;/);
  assert.match(screenSource, /isAllDay: modalIsAllDay,/);
});

test('modal places the all-day toggle after the title input and before the multi-day toggle', () => {
  const titleIndex = modalSource.indexOf('placeholder="Titel"');
  const allDayIndex = modalSource.indexOf('accessibilityLabel="Ganztägig"');
  const multiDayIndex = modalSource.indexOf('accessibilityLabel="Mehrtägiger Termin"');

  assert.ok(titleIndex > -1 && allDayIndex > -1 && multiDayIndex > -1);
  assert.ok(titleIndex < allDayIndex);
  assert.ok(allDayIndex < multiDayIndex);
});

test('modal exposes an accessible all-day checkbox and hides start time and duration controls while active', () => {
  assert.match(modalSource, /accessibilityState=\{\{ checked: modalIsAllDay \}\}/);
  assert.match(modalSource, /!modalIsAllDay && !modalFromPlus &&/);
  assert.match(modalSource, /!modalIsAllDay && modalFromPlus &&/);
  assert.match(modalSource, /\{!modalIsAllDay && \(\s*\n\s*<>\s*\n\s*<Text style=\{styles\.durationLabel\}>\s*\n\s*DAUER/);
});

test('modal save is enabled without a start minute while all-day is active', () => {
  assert.match(modalSource, /\(modalIsAllDay \|\| modalStartMinutes !== null\)/);
});

test('hook requires no start minute for all-day saves and forwards canonical all-day times', () => {
  assert.match(source, /if \(!isAllDay && \(modalStartMinutes === null \|\| modalStartMinutes === undefined\)\) return null;/);
  assert.match(source, /if \(isAllDay\) \{\s*\n\s*startTime = '00:00';\s*\n\s*endTime = '23:59';/);
});

test('add saves all-day events with canonical 00:00-23:59 times and no start minute', async () => {
  const runtime = loadHookRuntime({
    addEventImpl: async payload => ({
      id: 'created-all-day', date: payload.date, end_date: payload.endDate,
      start_time: payload.startTime, end_time: payload.endTime,
      title: payload.title, color: payload.color,
    }),
  });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();

  const savePromise = runtime.harness.result.saveEvent({
    eventDate: '2026-08-03', isMultiDay: false, endDate: null, isAllDay: true,
    modalTitle: 'Ganztägig', modalStartMinutes: null, modalDuration: 60, modalColor: '#fff',
  });
  await Promise.resolve();
  await Promise.resolve();

  const payload = runtime.mutationCalls.find(call => call[0] === 'add')[1];
  assert.equal(payload.startTime, '00:00');
  assert.equal(payload.endTime, '23:59');
  runtime.switchOwner(null);
  await savePromise;
});

test('update saves all-day events with canonical 00:00-23:59 times', async () => {
  const cachedEvent = {
    id: 'event-all-day', date: '2026-08-03', end_date: null,
    start_time: '09:00', end_time: '10:00', title: 'Termin', color: '#fff',
  };
  const runtime = loadHookRuntime({ dayCache: [cachedEvent] });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();

  await runtime.harness.result.saveEvent({
    editingEventId: cachedEvent.id,
    eventDate: cachedEvent.date, isMultiDay: false, endDate: null, isAllDay: true,
    modalTitle: 'Termin', modalStartMinutes: null, modalDuration: 60, modalColor: '#fff',
  });

  const payload = runtime.mutationCalls.find(call => call[0] === 'update')[1];
  assert.equal(payload.startTime, '00:00');
  assert.equal(payload.endTime, '23:59');
});

test('multi-day all-day saves forward both the canonical end date and all-day times', async () => {
  const runtime = loadHookRuntime({
    addEventImpl: async payload => ({
      id: 'created-multi-all-day', date: payload.date, end_date: payload.endDate,
      start_time: payload.startTime, end_time: payload.endTime,
      title: payload.title, color: payload.color,
    }),
  });
  runtime.harness.render(runtime.useDailyPlannerEvents, [2026, 7, '2026-08-03']);
  await runtime.harness.settle();

  const savePromise = runtime.harness.result.saveEvent({
    eventDate: '2026-08-03', isMultiDay: true, endDate: '2026-08-05', isAllDay: true,
    modalTitle: 'Reise', modalStartMinutes: null, modalDuration: 60, modalColor: '#fff',
  });
  await Promise.resolve();
  await Promise.resolve();

  const payload = runtime.mutationCalls.find(call => call[0] === 'add')[1];
  assert.equal(payload.endDate, '2026-08-05');
  assert.equal(payload.startTime, '00:00');
  assert.equal(payload.endTime, '23:59');
  runtime.switchOwner(null);
  await savePromise;
});

test('hook parses and imports only the owner-scoped planner cache', () => {
  assert.doesNotThrow(() => transformFileSync(filename, {
    babelrc: false,
    configFile: false,
    plugins: [transformModulesCommonJs],
  }));
  assert.match(source, /from '\.\.\/cache\/plannerCache'/);
  assert.doesNotMatch(source, /preloadedTools|getPreloadedToolData|setPreloadedToolData/);
});

test('cache reads happen only in effects guarded by a verified owner', () => {
  assert.match(source, /if \(!ownerUserId\) return;[\s\S]*getPlannerMonthCache\(ownerUserId/);
  assert.match(source, /if \(!ownerUserId \|\| !isValidDateString\(selectedDate\)\) return;[\s\S]*getPlannerDayCache\(ownerUserId/);
  assert.match(source, /setPlannerMonthCache\(requestOwnerId, currentYear, currentMonth, data\)/);
  assert.match(source, /setPlannerDayCache\(requestOwnerId, dateStr, data\)/);
  assert.match(source, /cached == null\)[\s\S]*setEvents\(\[\]\)[\s\S]*loadDayEvents\(selectedDate\)/);
  assert.match(source, /cached != null[\s\S]*setMonthEventDates[\s\S]*else[\s\S]*setMonthEventDates\(new Set\(\)\)[\s\S]*loadMonthEvents\(\)/);
});

test('auth lifecycle clears only the previous planner owner and invalidates requests and actions', () => {
  assert.match(source, /getCurrentUserId\(\)/);
  assert.match(source, /supabase\.auth\.onAuthStateChange/);
  assert.match(source, /if \(previousOwnerId === safeOwnerId\) return/);
  assert.match(source, /clearPlannerOwnerCache\(previousOwnerId\)/);
  assert.match(source, /monthRequestRef\.current \+= 1/);
  assert.match(source, /dayRequestRef\.current \+= 1/);
  assert.match(source, /pendingActionsRef\.current\.clear\(\)/);
});

test('late day and month responses require mount, request and owner identity', () => {
  for (const requestRef of ['monthRequestRef', 'dayRequestRef']) {
    const pattern = new RegExp(
      `!mountedRef\\.current[\\s\\S]*requestId !== ${requestRef}\\.current[\\s\\S]*ownerRef\\.current !== requestOwnerId`
    );
    assert.match(source, pattern);
  }
});

test('mutations bind to the verified active owner and invalidate required intervals', () => {
  assert.match(source, /const mutationOwnerId = ownerRef\.current;[\s\S]*getCurrentUserId\(\)[\s\S]*currentUserId !== mutationOwnerId/);
  assert.match(source, /originalEvent \? \[originalEvent, savedEvent\] : savedEvent/);
  assert.match(source, /if \(originalEvent\) invalidatePlannerEventCaches\(mutationOwnerId, originalEvent\)/);
  assert.match(source, /ownerRef\.current !== mutationOwnerId/);
  assert.match(source, /await refreshVisiblePlanner\(mutationOwnerId\)/);
  assert.match(source, /expectedUserId: mutationOwnerId/);
  assert.match(source, /deleteEvent\(id, mutationOwnerId\)/);
  assert.match(source, /`\$\{mutationOwnerId\}:(add|update|delete):/);
});

test('failed mutations do not invalidate and delete failure reloads only the active owner day', () => {
  const saveTry = source.slice(source.indexOf('const saveEvent'), source.indexOf('const removeEvent'));
  const saveInvalidation = saveTry.indexOf('invalidatePlannerEventCaches');
  assert.ok(saveInvalidation > saveTry.indexOf('const savedEvent'));
  assert.ok(saveInvalidation > saveTry.indexOf('if (!savedEvent) return null'));

  const removeStart = source.indexOf('const removeEvent');
  const deleteCatchStart = source.indexOf('} catch {', source.indexOf('await deleteEvent', removeStart));
  const deleteCatchEnd = source.indexOf('} finally', deleteCatchStart);
  const deleteCatch = source.slice(deleteCatchStart, deleteCatchEnd);
  assert.match(deleteCatch, /ownerRef\.current === mutationOwnerId[\s\S]*loadDayEvents\(selectedDate\)/);
  assert.doesNotMatch(deleteCatch, /invalidatePlannerEventCaches/);
});
