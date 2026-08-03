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
  return transformModule(path.resolve(__dirname, '../utils/plannerUtils.js'), {
    'react-native': { Dimensions: { get: () => ({ width: 390 }) } },
    '../../../../constants/layout': { s: value => value, sv: value => value },
  });
}

function loadCache() {
  return transformModule(path.resolve(__dirname, './plannerCache.js'), {
    '../utils/plannerUtils': loadPlannerUtils(),
  });
}

test('isolates day and zero-based month caches by owner', () => {
  const cache = loadCache();
  cache.setPlannerDayCache('owner-a', '2026-08-03', ['day-a']);
  cache.setPlannerDayCache('owner-b', '2026-08-03', ['day-b']);
  cache.setPlannerMonthCache('owner-a', 2026, 7, ['month-a']);
  cache.setPlannerMonthCache('owner-b', 2026, 7, ['month-b']);

  assert.deepEqual(cache.getPlannerDayCache('owner-a', '2026-08-03'), ['day-a']);
  assert.deepEqual(cache.getPlannerDayCache('owner-b', '2026-08-03'), ['day-b']);
  assert.deepEqual(cache.getPlannerMonthCache('owner-a', 2026, 7), ['month-a']);
  assert.deepEqual(cache.getPlannerMonthCache('owner-b', 2026, 7), ['month-b']);
});

test('single-day null-end event invalidates only its overlapping existing entries', () => {
  const cache = loadCache();
  cache.setPlannerDayCache('owner-a', '2026-08-03', ['hit']);
  cache.setPlannerDayCache('owner-a', '2026-08-04', ['keep']);
  cache.setPlannerMonthCache('owner-a', 2026, 7, ['august']);
  cache.setPlannerMonthCache('owner-a', 2026, 8, ['september']);

  cache.invalidatePlannerEventCaches('owner-a', { date: '2026-08-03', end_date: null });

  assert.equal(cache.getPlannerDayCache('owner-a', '2026-08-03'), null);
  assert.deepEqual(cache.getPlannerDayCache('owner-a', '2026-08-04'), ['keep']);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2026, 7), null);
  assert.deepEqual(cache.getPlannerMonthCache('owner-a', 2026, 8), ['september']);
});

test('multi-day event invalidates both sides of a month boundary', () => {
  const cache = loadCache();
  cache.setPlannerDayCache('owner-a', '2026-08-31', ['august-day']);
  cache.setPlannerDayCache('owner-a', '2026-09-01', ['september-day']);
  cache.setPlannerMonthCache('owner-a', 2026, 7, ['august']);
  cache.setPlannerMonthCache('owner-a', 2026, 8, ['september']);

  cache.invalidatePlannerEventCaches('owner-a', {
    date: '2026-08-31',
    end_date: '2026-09-01',
  });

  assert.equal(cache.getPlannerDayCache('owner-a', '2026-08-31'), null);
  assert.equal(cache.getPlannerDayCache('owner-a', '2026-09-01'), null);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2026, 7), null);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2026, 8), null);
});

test('invalidates across a year boundary without touching non-overlapping entries', () => {
  const cache = loadCache();
  cache.setPlannerDayCache('owner-a', '2026-12-31', ['old-year']);
  cache.setPlannerDayCache('owner-a', '2027-01-01', ['new-year']);
  cache.setPlannerDayCache('owner-a', '2027-02-01', ['keep']);
  cache.setPlannerMonthCache('owner-a', 2026, 11, ['december']);
  cache.setPlannerMonthCache('owner-a', 2027, 0, ['january']);
  cache.setPlannerMonthCache('owner-a', 2027, 1, ['february']);

  cache.invalidatePlannerEventCaches('owner-a', {
    date: '2026-12-31',
    end_date: '2027-01-01',
  });

  assert.equal(cache.getPlannerDayCache('owner-a', '2026-12-31'), null);
  assert.equal(cache.getPlannerDayCache('owner-a', '2027-01-01'), null);
  assert.deepEqual(cache.getPlannerDayCache('owner-a', '2027-02-01'), ['keep']);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2026, 11), null);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2027, 0), null);
  assert.deepEqual(cache.getPlannerMonthCache('owner-a', 2027, 1), ['february']);
});

test('invalidates old and new intervals together while retaining another owner', () => {
  const cache = loadCache();
  for (const owner of ['owner-a', 'owner-b']) {
    cache.setPlannerDayCache(owner, '2026-08-03', [`${owner}-old`]);
    cache.setPlannerDayCache(owner, '2026-09-10', [`${owner}-new`]);
    cache.setPlannerMonthCache(owner, 2026, 7, [`${owner}-august`]);
    cache.setPlannerMonthCache(owner, 2026, 8, [`${owner}-september`]);
  }

  cache.invalidatePlannerEventCaches('owner-a', [
    { date: '2026-08-03', end_date: '2026-08-04' },
    { date: '2026-09-10', end_date: '2026-09-12' },
  ]);

  assert.equal(cache.getPlannerDayCache('owner-a', '2026-08-03'), null);
  assert.equal(cache.getPlannerDayCache('owner-a', '2026-09-10'), null);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2026, 7), null);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2026, 8), null);
  assert.deepEqual(cache.getPlannerDayCache('owner-b', '2026-08-03'), ['owner-b-old']);
  assert.deepEqual(cache.getPlannerMonthCache('owner-b', 2026, 8), ['owner-b-september']);
});

test('very long interval examines only the few cached keys', () => {
  const cache = loadCache();
  cache.setPlannerDayCache('owner-a', '1900-01-01', ['first']);
  cache.setPlannerDayCache('owner-a', '2500-12-31', ['last']);
  cache.setPlannerMonthCache('owner-a', 2200, 5, ['middle']);

  cache.invalidatePlannerEventCaches('owner-a', {
    date: '1800-01-01',
    end_date: '2600-12-31',
  });

  assert.equal(cache.getPlannerDayCache('owner-a', '1900-01-01'), null);
  assert.equal(cache.getPlannerDayCache('owner-a', '2500-12-31'), null);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2200, 5), null);
});

test('invalid owners, arguments and reversed intervals fail closed without mutation', () => {
  const cache = loadCache();
  const dayData = ['day'];
  const monthData = ['month'];
  cache.setPlannerDayCache('owner-a', '2026-08-03', dayData);
  cache.setPlannerMonthCache('owner-a', 2026, 7, monthData);

  cache.setPlannerDayCache(' ', '2026-08-03', ['invalid-owner']);
  cache.setPlannerDayCache('owner-a', '2026-02-30', ['invalid-date']);
  cache.setPlannerMonthCache('owner-a', 2026, 12, ['invalid-month']);
  cache.invalidatePlannerEventCaches('owner-a', [
    { date: '2026-08-05', end_date: '2026-08-03' },
    { date: '2026-02-30', end_date: null },
  ]);

  assert.equal(cache.getPlannerDayCache(' ', '2026-08-03'), null);
  assert.equal(cache.getPlannerDayCache('owner-a', '2026-02-30'), null);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2026, 12), null);
  assert.equal(cache.getPlannerDayCache('owner-a', '2026-08-03'), dayData);
  assert.equal(cache.getPlannerMonthCache('owner-a', 2026, 7), monthData);
});

test('clearPlannerOwnerCache clears only the requested owner without mutating data', () => {
  const cache = loadCache();
  const ownerAData = Object.freeze([{ id: 'a' }]);
  const ownerBData = Object.freeze([{ id: 'b' }]);
  cache.setPlannerDayCache('owner-a', '2026-08-03', ownerAData);
  cache.setPlannerDayCache('owner-b', '2026-08-03', ownerBData);

  cache.clearPlannerOwnerCache('owner-a');

  assert.equal(cache.getPlannerDayCache('owner-a', '2026-08-03'), null);
  assert.equal(cache.getPlannerDayCache('owner-b', '2026-08-03'), ownerBData);
  assert.deepEqual(ownerAData, [{ id: 'a' }]);
  assert.deepEqual(ownerBData, [{ id: 'b' }]);
});
