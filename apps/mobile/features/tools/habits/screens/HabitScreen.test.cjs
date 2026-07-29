const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, './HabitScreen.jsx'), 'utf8');

test('HabitScreen.jsx integrates Collections', () => {
  assert.match(source, /useHabitCollections/);
  assert.match(source, /HabitCollectionItem/);
  assert.match(source, /useFocusEffect/);
});

test('HabitScreen.jsx filters child habits', () => {
  assert.match(source, /collectionChildHabitIds/);
  assert.match(source, /visibleFree/);
  assert.match(source, /visibleDueCollections/);
});

test('HabitScreen.jsx calculates progress', () => {
  assert.match(source, /progress_completed/);
  assert.match(source, /progress_total/);
});

test('HabitScreen.jsx renders collections and habits', () => {
  assert.match(source, /overviewGroups\.openCollections\.map/);
  assert.match(source, /overviewGroups\.openHabits\.map/);
  assert.match(source, /overviewGroups\.completedCollections\.map/);
  assert.match(source, /overviewGroups\.completedHabits\.map/);
  assert.match(source, /HabitCollectionItem/);
  assert.match(source, /HabitItem/);
});

test('HabitScreen.jsx renders the four overview groups in the required order', () => {
  const openCollections = source.indexOf('overviewGroups.openCollections.map');
  const openHabits = source.indexOf('overviewGroups.openHabits.map');
  const completedCollections = source.indexOf('overviewGroups.completedCollections.map');
  const completedHabits = source.indexOf('overviewGroups.completedHabits.map');

  assert.ok(openCollections < openHabits);
  assert.ok(openHabits < completedCollections);
  assert.ok(completedCollections < completedHabits);
});

test('HabitScreen.jsx provides collection management', () => {
  assert.match(source, /handleOpenCollections/);
  assert.match(source, /habits-collections/);
});

test('HabitScreen.jsx preserves add habit flow', () => {
  assert.match(source, /openAddModal/);
  assert.match(source, /AddHabitModal/);
  assert.match(source, /handleSaveHabit/);
});

test('HabitScreen.jsx counts a due collection as one visual progress item', () => {
  assert.match(source, /visibleFreeHabits\.length \+ visibleDueCollections\.length/);
  assert.match(source, /progress_completed === collection\.progress_total/);
});

test('HabitScreen.jsx uses canonical tools router paths', () => {
  assert.match(source, /['"]\/tools\/habits-collections['"]/);
  assert.match(source, /['"]\/tools\/habits-collection-detail['"]/);
  assert.doesNotMatch(source, /pathname:\s*['"]\/habits-/);
});
