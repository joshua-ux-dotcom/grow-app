const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { transformFileSync } = require('@babel/core');
const transformModulesCommonJs = require('@babel/plugin-transform-modules-commonjs');

const filename = path.resolve(__dirname, './habitUtils.js');
const code = transformFileSync(filename, {
  babelrc: false,
  configFile: false,
  plugins: [transformModulesCommonJs],
}).code;
const moduleUnderTest = { exports: {} };
new Function('require', 'module', 'exports', '__filename', '__dirname', code)(
  require,
  moduleUnderTest,
  moduleUnderTest.exports,
  filename,
  path.dirname(filename)
);

const {
  groupHabitOverviewItems,
  partitionHabitsByCompletion,
} = moduleUnderTest.exports;
const habits = [
  { id: 'habit-a' },
  { id: 'habit-b' },
  { id: 'habit-c' },
  { id: 'habit-d' },
];

test('keeps open habits before completed habits with stable group order', () => {
  const ordered = partitionHabitsByCompletion(habits, new Set(['habit-b', 'habit-d']));

  assert.deepEqual(ordered.map(habit => habit.id), [
    'habit-a',
    'habit-c',
    'habit-b',
    'habit-d',
  ]);
});

test('restores original open-group position after unchecking', () => {
  const completed = partitionHabitsByCompletion(habits, new Set(['habit-b']));
  const reopened = partitionHabitsByCompletion(habits, new Set());

  assert.deepEqual(completed.map(habit => habit.id), [
    'habit-a',
    'habit-c',
    'habit-d',
    'habit-b',
  ]);
  assert.deepEqual(reopened.map(habit => habit.id), habits.map(habit => habit.id));
});

test('uses only the completion set supplied for the selected day', () => {
  const monday = partitionHabitsByCompletion(habits, new Set(['habit-a']));
  const tuesday = partitionHabitsByCompletion(habits, new Set(['habit-c']));

  assert.deepEqual(monday.map(habit => habit.id), [
    'habit-b',
    'habit-c',
    'habit-d',
    'habit-a',
  ]);
  assert.deepEqual(tuesday.map(habit => habit.id), [
    'habit-a',
    'habit-b',
    'habit-d',
    'habit-c',
  ]);
});

const collections = [
  { id: 'collection-a', progress_completed: 0, progress_total: 2 },
  { id: 'collection-b', progress_completed: 2, progress_total: 2 },
  { id: 'collection-c', progress_completed: 1, progress_total: 3 },
  { id: 'collection-d', progress_completed: 1, progress_total: 1 },
];

test('orders the four overview groups while preserving relative order', () => {
  const groups = groupHabitOverviewItems(
    habits,
    collections,
    new Set(['habit-b', 'habit-d'])
  );

  assert.deepEqual(groups.openCollections.map(item => item.id), [
    'collection-a',
    'collection-c',
  ]);
  assert.deepEqual(groups.openHabits.map(item => item.id), [
    'habit-a',
    'habit-c',
  ]);
  assert.deepEqual(groups.completedCollections.map(item => item.id), [
    'collection-b',
    'collection-d',
  ]);
  assert.deepEqual(groups.completedHabits.map(item => item.id), [
    'habit-b',
    'habit-d',
  ]);
});

test('restores reopened collection and habit to their original open positions', () => {
  const reopened = collections.map(collection => (
    collection.id === 'collection-b'
      ? { ...collection, progress_completed: 1 }
      : collection
  ));
  const groups = groupHabitOverviewItems(
    habits,
    reopened,
    new Set(['habit-d'])
  );

  assert.deepEqual(groups.openCollections.map(item => item.id), [
    'collection-a',
    'collection-b',
    'collection-c',
  ]);
  assert.deepEqual(groups.openHabits.map(item => item.id), [
    'habit-a',
    'habit-b',
    'habit-c',
  ]);
});

test('uses completion values calculated for the selected day', () => {
  const monday = groupHabitOverviewItems(habits, collections, new Set(['habit-a']));
  const tuesdayCollections = collections.map(collection => (
    collection.id === 'collection-a'
      ? { ...collection, progress_completed: collection.progress_total }
      : { ...collection, progress_completed: 0 }
  ));
  const tuesday = groupHabitOverviewItems(
    habits,
    tuesdayCollections,
    new Set(['habit-c'])
  );

  assert.deepEqual(monday.completedCollections.map(item => item.id), [
    'collection-b',
    'collection-d',
  ]);
  assert.deepEqual(monday.completedHabits.map(item => item.id), ['habit-a']);
  assert.deepEqual(tuesday.completedCollections.map(item => item.id), ['collection-a']);
  assert.deepEqual(tuesday.completedHabits.map(item => item.id), ['habit-c']);
});
