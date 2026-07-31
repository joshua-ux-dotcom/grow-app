const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { transformFileSync } = require('@babel/core');
const transformModulesCommonJs = require('@babel/plugin-transform-modules-commonjs');

const values = new Map();
const removedKeys = [];
let getItemOverride = null;
let removeItemOverride = null;
const AsyncStorage = {
  async getItem(key) {
    if (getItemOverride) return getItemOverride(key);
    return values.has(key) ? values.get(key) : null;
  },
  async setItem(key, value) {
    values.set(key, value);
  },
  async removeItem(key) {
    if (removeItemOverride) return removeItemOverride(key);
    removedKeys.push(key);
    values.delete(key);
  },
};

const filename = path.resolve(__dirname, './habitCollectionDrafts.js');
const code = transformFileSync(filename, {
  babelrc: false,
  configFile: false,
  plugins: [transformModulesCommonJs],
}).code;
const loadedModule = { exports: {} };
new Function('require', 'module', 'exports', '__filename', '__dirname', code)(
  request => (
    request === '@react-native-async-storage/async-storage'
      ? AsyncStorage
      : require(request)
  ),
  loadedModule,
  loadedModule.exports,
  filename,
  __dirname
);

const {
  areHabitCollectionSnapshotsEqual,
  createHabitCollectionBaseline,
  createEmptyHabitCollectionSnapshot,
  getHabitCollectionDraftKey,
  loadHabitCollectionDraft,
  normalizeHabitCollectionSnapshot,
  removeHabitCollectionDraft,
  sanitizeHabitCollectionSnapshot,
  saveHabitCollectionDraft,
} = loadedModule.exports;

const completeSnapshot = {
  name: 'Morgen',
  days: [3, 1, 1],
  selectedHabitIds: ['habit-b', 'habit-a'],
  newHabits: [{ tempId: 'new-1', name: ' Wasser ' }],
  memberOrder: ['new-1', 'habit-a', 'habit-b'],
  newHabitName: 'Noch nicht bestätigt',
};

test.beforeEach(() => {
  values.clear();
  removedKeys.length = 0;
  getItemOverride = null;
  removeItemOverride = null;
});

test('create and edit drafts round-trip every form field with the V1 payload', async () => {
  const createKey = getHabitCollectionDraftKey('user-a', 'create');
  const editKey = getHabitCollectionDraftKey('user-a', 'edit', 'collection-a');

  await saveHabitCollectionDraft(createKey, completeSnapshot);
  await saveHabitCollectionDraft(editKey, { ...completeSnapshot, name: 'Bearbeitet' });

  assert.deepEqual(JSON.parse(values.get(createKey)), {
    version: 1,
    snapshot: {
      name: 'Morgen',
      days: [1, 3],
      selectedHabitIds: ['habit-b', 'habit-a'],
      newHabits: [{ tempId: 'new-1', name: 'Wasser' }],
      memberOrder: ['new-1', 'habit-a', 'habit-b'],
      newHabitName: 'Noch nicht bestätigt',
    },
  });
  assert.equal((await loadHabitCollectionDraft(editKey)).snapshot.name, 'Bearbeitet');
});

test('keys isolate users, create, edit and individual collections', () => {
  const createA = getHabitCollectionDraftKey('user-a', 'create');
  const createB = getHabitCollectionDraftKey('user-b', 'create');
  const editA = getHabitCollectionDraftKey('user-a', 'edit', 'collection-a');
  const editB = getHabitCollectionDraftKey('user-a', 'edit', 'collection-b');

  assert.equal(createA, '@grow/habit-collection-draft/v1/user-a/create');
  assert.equal(editA, '@grow/habit-collection-draft/v1/user-a/edit/collection-a');
  assert.notEqual(createA, createB);
  assert.notEqual(createA, editA);
  assert.notEqual(editA, editB);
});

test('a valid edit draft remains available to win over the server baseline', async () => {
  const key = getHabitCollectionDraftKey('user-a', 'edit', 'collection-a');
  const baseline = createHabitCollectionBaseline({
    name: 'Server',
    days: [1],
    members: [{ habit_id: 'habit-a' }],
  });
  await saveHabitCollectionDraft(key, { ...baseline, name: 'Lokaler Draft' });

  assert.equal((await loadHabitCollectionDraft(key)).snapshot.name, 'Lokaler Draft');
  assert.equal(baseline.name, 'Server');
});

test('normalized unchanged baseline is not dirty', () => {
  const baseline = createHabitCollectionBaseline({
    name: 'Server',
    days: [4, 2],
    members: [{ habit_id: 'habit-a' }, { habit_id: 'habit-b' }],
  });
  assert.equal(areHabitCollectionSnapshotsEqual(baseline, {
    ...baseline,
    days: [2, 4, 2],
  }), true);
  assert.equal(areHabitCollectionSnapshotsEqual(baseline, {
    ...baseline,
    name: 'Geändert',
  }), false);
});

test('corrupt, incomplete and foreign-version drafts are never activated', async () => {
  const corruptKey = getHabitCollectionDraftKey('user-a', 'create');
  const foreignKey = getHabitCollectionDraftKey('user-a', 'edit', 'collection-a');
  const incompleteKey = getHabitCollectionDraftKey('user-a', 'edit', 'collection-b');
  values.set(corruptKey, '{broken');
  values.set(foreignKey, JSON.stringify({ version: 2, snapshot: completeSnapshot }));
  values.set(incompleteKey, JSON.stringify({ version: 1, snapshot: { name: 'Incomplete' } }));

  assert.equal((await loadHabitCollectionDraft(corruptKey)).status, 'invalid');
  assert.equal((await loadHabitCollectionDraft(foreignKey)).status, 'invalid');
  assert.equal((await loadHabitCollectionDraft(incompleteKey)).status, 'invalid');
  assert.deepEqual(removedKeys, [corruptKey, foreignKey, incompleteKey]);
});

test('invalid draft cleanup is bounded to two attempts', async () => {
  const key = getHabitCollectionDraftKey('cleanup-user', 'create');
  values.set(key, '{broken');
  let attempts = 0;
  removeItemOverride = async () => {
    attempts += 1;
    throw new Error('storage unavailable');
  };

  assert.equal((await loadHabitCollectionDraft(key)).status, 'invalid');
  assert.equal(attempts, 2);
  assert.equal(values.has(key), true);
});

test('operational read errors remain distinguishable and never remove a draft', async () => {
  const key = getHabitCollectionDraftKey('read-error-user', 'create');
  getItemOverride = async () => {
    throw new Error('read unavailable');
  };

  await assert.rejects(() => loadHabitCollectionDraft(key), /read unavailable/);
  assert.deepEqual(removedKeys, []);
});

test('remove deletes only the requested draft key', async () => {
  const createKey = getHabitCollectionDraftKey('user-a', 'create');
  const editKey = getHabitCollectionDraftKey('user-a', 'edit', 'collection-a');
  await saveHabitCollectionDraft(createKey, completeSnapshot);
  await saveHabitCollectionDraft(editKey, completeSnapshot);

  await removeHabitCollectionDraft(editKey);

  assert.ok(values.has(createKey));
  assert.equal(values.has(editKey), false);
});

test('stale habit ids are removed before persistence without losing valid order', () => {
  const sanitized = sanitizeHabitCollectionSnapshot({
    ...completeSnapshot,
    selectedHabitIds: ['habit-a', 'stale-habit'],
    memberOrder: ['new-1', 'stale-habit', 'habit-a'],
  }, new Set(['habit-a']));

  assert.deepEqual(sanitized.selectedHabitIds, ['habit-a']);
  assert.deepEqual(sanitized.memberOrder, ['new-1', 'habit-a']);
  assert.deepEqual(normalizeHabitCollectionSnapshot(sanitized), sanitized);
  assert.deepEqual(createEmptyHabitCollectionSnapshot().memberOrder, []);
});
