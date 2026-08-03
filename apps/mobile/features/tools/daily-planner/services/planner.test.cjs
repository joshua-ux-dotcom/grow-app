const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { transformFileSync } = require('@babel/core');
const transformModulesCommonJs = require('@babel/plugin-transform-modules-commonjs');

function transformModule(filename, mocks) {
  const code = transformFileSync(filename, {
    babelrc: false,
    configFile: false,
    plugins: [transformModulesCommonJs],
  }).code;
  const module = { exports: {} };
  const localRequire = request => {
    if (Object.prototype.hasOwnProperty.call(mocks, request)) return mocks[request];
    return require(request);
  };
  new Function('require', 'module', 'exports', '__filename', '__dirname', code)(
    localRequire, module, module.exports, filename, path.dirname(filename)
  );
  return module.exports;
}

function loadPlannerUtils() {
  const filename = path.resolve(__dirname, '../utils/plannerUtils.js');
  return transformModule(filename, {
    'react-native': { Dimensions: { get: () => ({ width: 390 }) } },
    '../../../../constants/layout': { s: value => value, sv: value => value },
  });
}

function loadService({ currentUserId = 'user-a', queryResult = { data: [], error: null } } = {}) {
  const calls = [];
  let authCalls = 0;
  const chain = new Proxy({}, {
    get: (_target, property) => {
      if (property === 'then') return resolve => Promise.resolve(queryResult).then(resolve);
      return (...args) => {
        calls.push([property, ...args]);
        return chain;
      };
    },
  });
  const filename = path.resolve(__dirname, './planner.js');
  const service = transformModule(filename, {
    '../../../../services/supabaseClient': {
      supabase: {
        from: (...args) => {
          calls.push(['from', ...args]);
          return chain;
        },
      },
    },
    '../../../../services/authUser': {
      getCurrentUserId: async () => {
        authCalls += 1;
        return currentUserId;
      },
    },
    '../utils/plannerUtils': loadPlannerUtils(),
  });
  return {
    calls,
    service,
    get authCalls() {
      return authCalls;
    },
  };
}

const row = {
  id: 'event-a',
  user_id: 'user-a',
  date: '2026-08-02',
  end_date: null,
  start_time: '09:00',
  end_time: '10:00',
  title: 'Termin',
  color: '#D4AF37',
};

function findCall(calls, method) {
  return calls.find(call => call[0] === method);
}

test('day query uses an inclusive owned interval filter and normalizes single-day rows', async () => {
  const { calls, service } = loadService({ queryResult: { data: [row], error: null } });
  const result = await service.getEventsForDate('2026-08-02');

  assert.deepEqual(result, [row]);
  assert.deepEqual(findCall(calls, 'eq'), ['eq', 'user_id', 'user-a']);
  assert.deepEqual(findCall(calls, 'lte'), ['lte', 'date', '2026-08-02']);
  assert.deepEqual(findCall(calls, 'or'), [
    'or',
    'end_date.gte.2026-08-02,and(end_date.is.null,date.gte.2026-08-02)',
  ]);
});

test('day query includes multi-day rows that begin before the selected day and keeps original fields', async () => {
  const multiDay = { ...row, date: '2026-07-31', end_date: '2026-08-02' };
  const { service } = loadService({ queryResult: { data: [multiDay], error: null } });

  assert.deepEqual(await service.getEventsForDate('2026-08-02'), [multiDay]);
});

test('month query uses inclusive overlap boundaries and selects id, date and end_date', async () => {
  const { calls, service } = loadService();
  await service.getEventsForMonth(2026, 2);

  assert.deepEqual(findCall(calls, 'select'), ['select', 'id,date,end_date']);
  assert.deepEqual(findCall(calls, 'eq'), ['eq', 'user_id', 'user-a']);
  assert.deepEqual(findCall(calls, 'lte'), ['lte', 'date', '2026-02-28']);
  assert.deepEqual(findCall(calls, 'or'), [
    'or',
    'end_date.gte.2026-02-01,and(end_date.is.null,date.gte.2026-02-01)',
  ]);
});

test('invalid calendar inputs are rejected before a Supabase query or filter construction', async () => {
  const { calls, service } = loadService();

  assert.deepEqual(await service.getEventsForDate('2026-02-30'), []);
  assert.deepEqual(await service.getEventsForMonth(2026, 13), []);
  assert.deepEqual(await service.getEventsForMonth(10000, 1), []);
  assert.deepEqual(calls, []);
});

test('create stores an owned single-day event with a canonical null end date', async () => {
  const { calls, service } = loadService({ queryResult: { data: row, error: null } });
  await service.addEvent({
    date: '2026-08-02',
    endDate: '2026-08-02',
    startTime: '09:00',
    endTime: '10:00',
    title: ' Termin ',
    color: '#D4AF37',
  });

  assert.deepEqual(findCall(calls, 'insert')[1], {
    user_id: 'user-a',
    date: '2026-08-02',
    end_date: null,
    start_time: '09:00',
    end_time: '10:00',
    title: 'Termin',
    color: '#D4AF37',
  });
});

test('create stores a valid multi-day end and rejects reversed or invalid dates before insert', async () => {
  const valid = loadService({ queryResult: { data: { ...row, end_date: '2026-08-04' }, error: null } });
  await valid.service.addEvent({
    date: '2026-08-02', endDate: '2026-08-04', startTime: '09:00', endTime: '10:00', title: 'Termin',
  });
  assert.equal(findCall(valid.calls, 'insert')[1].end_date, '2026-08-04');

  for (const input of [
    { date: '2026-08-02', endDate: '2026-08-01' },
    { date: '2026-02-30', endDate: null },
    { date: '2026-08-02', endDate: 'bad.filter,value' },
  ]) {
    const attempt = loadService();
    await assert.rejects(attempt.service.addEvent({
      ...input, startTime: '09:00', endTime: '10:00', title: 'Termin',
    }));
    assert.equal(attempt.authCalls, 0);
    assert.equal(findCall(attempt.calls, 'insert'), undefined);
  }
});

test('update can change date and end_date while retaining owner and id filters', async () => {
  const updated = { ...row, date: '2026-09-01', end_date: '2026-09-03' };
  const { calls, service } = loadService({ queryResult: { data: updated, error: null } });
  const result = await service.updateEvent({
    id: 'event-a',
    date: '2026-09-01',
    endDate: '2026-09-03',
    startTime: '11:00',
    endTime: '12:00',
    title: 'Neu',
    color: '#123456',
  });

  assert.deepEqual(findCall(calls, 'update')[1], {
    start_time: '11:00', end_time: '12:00', title: 'Neu', color: '#123456',
    date: '2026-09-01', end_date: '2026-09-03',
  });
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'id' && call[2] === 'event-a'));
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'user-a'));
  assert.deepEqual(result, updated);
});

test('update canonicalizes equal dates and rejects invalid intervals before auth or update', async () => {
  const equal = loadService({ queryResult: { data: row, error: null } });
  await equal.service.updateEvent({
    id: 'event-a', date: '2026-08-02', endDate: '2026-08-02',
    startTime: '09:00', endTime: '10:00', title: 'Termin',
  });
  assert.equal(findCall(equal.calls, 'update')[1].end_date, null);

  for (const input of [
    { date: '2026-02-30', endDate: null },
    { date: '2026-08-02', endDate: '2026-08-01' },
  ]) {
    const attempt = loadService();
    await assert.rejects(attempt.service.updateEvent({
      id: 'event-a', ...input,
      startTime: '09:00', endTime: '10:00', title: 'Termin',
    }));
    assert.equal(attempt.authCalls, 0);
    assert.equal(findCall(attempt.calls, 'update'), undefined);
  }
});

test('normalization preserves id, dates, times, title and color while canonicalizing equal ends', () => {
  const { service } = loadService();
  const input = { ...row, end_date: row.date };

  assert.deepEqual(service.normalizePlannerEvent(input), { ...input, end_date: null });
  assert.equal(service.normalizePlannerEvent(input).id, 'event-a');
  assert.equal(service.normalizePlannerEvent(input).start_time, '09:00');
  assert.equal(service.normalizePlannerEvent(input).end_time, '10:00');
  assert.equal(service.normalizePlannerEvent(input).title, 'Termin');
  assert.equal(service.normalizePlannerEvent(input).color, '#D4AF37');
});
