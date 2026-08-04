const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { transformFileSync } = require('@babel/core');
const transformModulesCommonJs = require('@babel/plugin-transform-modules-commonjs');

const filename = path.resolve(__dirname, './plannerUtils.js');
const code = transformFileSync(filename, {
  babelrc: false,
  configFile: false,
  plugins: [transformModulesCommonJs],
}).code;
const moduleUnderTest = { exports: {} };
const localRequire = request => {
  if (request === 'react-native') {
    return { Dimensions: { get: () => ({ width: 390 }) } };
  }
  if (request === '../../../../constants/layout') {
    return { s: value => value, sv: value => value };
  }
  return require(request);
};
new Function('require', 'module', 'exports', '__filename', '__dirname', code)(
  localRequire,
  moduleUnderTest,
  moduleUnderTest.exports,
  filename,
  path.dirname(filename)
);

const {
  addCalendarDays,
  buildMultiDayEventViewModel,
  eventOverlapsDate,
  eventOverlapsMonth,
  getEffectiveEventEndDate,
  getEventInterval,
  getEventSegment,
  getEventSpanType,
  getInclusiveDayCount,
  getMonthEventDateMarkers,
  isValidDateString,
  dateStringToLocalDate,
  localDateToDateString,
} = moduleUnderTest.exports;

test('converts floating calendar dates without UTC conversion', () => {
  for (const dateStr of ['2024-02-29', '2026-03-29', '2026-10-25']) {
    const localDate = dateStringToLocalDate(dateStr);
    assert.equal(localDateToDateString(localDate), dateStr);
    assert.equal(localDate.getHours(), 0);
  }
  assert.equal(dateStringToLocalDate('2026-02-30'), null);
  assert.equal(localDateToDateString(new Date('invalid')), null);
});

test('validates real YYYY-MM-DD calendar dates', () => {
  for (const value of ['2026-08-02', '2024-02-29', '2026-03-29', '2026-10-25']) {
    assert.equal(isValidDateString(value), true, value);
  }
  for (const value of ['2026-2-02', '2026-02-29', '2024-04-31', '0000-01-01', '2026-13-01', null]) {
    assert.equal(isValidDateString(value), false, String(value));
  }
});

test('adds calendar days across months, years, leap days and DST-adjacent dates', () => {
  assert.equal(addCalendarDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addCalendarDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addCalendarDays('2024-02-29', 1), '2024-03-01');
  assert.equal(addCalendarDays('2026-03-29', 1), '2026-03-30');
  assert.equal(addCalendarDays('2026-10-25', 1), '2026-10-26');
  assert.equal(addCalendarDays('2027-01-01', -1), '2026-12-31');
});

test('treats null or equal effective ends as single-day intervals', () => {
  const withoutEnd = { date: '2026-08-02', end_date: null };
  const equalEnd = { date: '2026-08-02', end_date: '2026-08-02' };

  assert.equal(getEffectiveEventEndDate(withoutEnd), '2026-08-02');
  assert.equal(getEventSpanType(withoutEnd), 'single');
  assert.equal(getEventSpanType(equalEnd), 'single');
  assert.deepEqual(getEventInterval(equalEnd), {
    startDate: '2026-08-02',
    endDate: '2026-08-02',
    dayCount: 1,
    type: 'single',
  });
});

test('counts inclusive days and rejects reversed or invalid intervals', () => {
  assert.equal(getInclusiveDayCount('2026-08-02', '2026-08-02'), 1);
  assert.equal(getInclusiveDayCount('2026-12-31', '2027-01-02'), 3);
  assert.equal(getInclusiveDayCount('2024-02-28', '2024-03-01'), 3);
  assert.equal(getInclusiveDayCount('2026-08-03', '2026-08-02'), null);
  assert.equal(getEventInterval({ date: '2026-08-03', end_date: '2026-08-02' }), null);
  assert.equal(getEventInterval({ date: '2026-02-30', end_date: null }), null);
});

test('detects date and month overlap with inclusive end dates', () => {
  const event = { date: '2026-01-31', end_date: '2026-03-01' };

  assert.equal(eventOverlapsDate(event, '2026-01-31'), true);
  assert.equal(eventOverlapsDate(event, '2026-03-01'), true);
  assert.equal(eventOverlapsDate(event, '2026-03-02'), false);
  assert.equal(eventOverlapsMonth(event, 2026, 0), true);
  assert.equal(eventOverlapsMonth(event, 2026, 1), true);
  assert.equal(eventOverlapsMonth(event, 2026, 2), true);
  assert.equal(eventOverlapsMonth(event, 2026, 3), false);
});

test('returns start, middle and end only for covered multi-day dates', () => {
  const event = { date: '2026-08-02', end_date: '2026-08-04' };

  assert.equal(getEventSegment(event, '2026-08-02'), 'start');
  assert.equal(getEventSegment(event, '2026-08-03'), 'middle');
  assert.equal(getEventSegment(event, '2026-08-04'), 'end');
  assert.equal(getEventSegment(event, '2026-08-05'), null);
  assert.equal(getEventSegment({ date: '2026-08-02', end_date: null }, '2026-08-02'), null);
});

test('builds a multi-day view model without changing original id, dates or times', () => {
  const event = {
    id: 'event-original',
    date: '2026-08-02',
    end_date: '2026-08-04',
    start_time: '22:30',
    end_time: '01:15',
    title: 'Reise',
    color: '#D4AF37',
  };

  assert.deepEqual(buildMultiDayEventViewModel(event, '2026-08-03'), {
    eventId: 'event-original',
    title: 'Reise',
    color: '#D4AF37',
    startDate: '2026-08-02',
    endDate: '2026-08-04',
    startTime: '22:30',
    endTime: '01:15',
    selectedDate: '2026-08-03',
    segment: 'middle',
    dayIndex: 2,
    totalDays: 3,
  });
  assert.equal(buildMultiDayEventViewModel({ ...event, id: null }, '2026-08-03'), null);
});

test('limits month markers to the requested month and deduplicates dates', () => {
  const events = [
    { date: '2026-01-30', end_date: '2026-03-02' },
    { date: '2026-02-10', end_date: null },
    { date: '2026-02-10', end_date: '2026-02-11' },
    { date: '2026-02-20', end_date: '2026-02-19' },
  ];
  const markers = getMonthEventDateMarkers(events, 2026, 1);

  assert.equal(markers.length, 28);
  assert.equal(markers[0], '2026-02-01');
  assert.equal(markers.at(-1), '2026-02-28');
  assert.equal(new Set(markers).size, markers.length);
  assert.equal(markers.some(date => !date.startsWith('2026-02-')), false);
});
