const assert = require('node:assert/strict');
const test = require('node:test');

test('habitCollections.js exports all required functions', () => {
  const source = require('fs').readFileSync(
    require('path').resolve(__dirname, './habitCollections.js'),
    'utf8'
  );

  // Exports error class
  assert.match(source, /HabitCollectionApiError/);

  // Exports request function
  assert.match(source, /requestCollectionsV1/);

  // Exports all CRUD operations
  assert.match(source, /listHabitCollections/);
  assert.match(source, /getHabitCollection/);
  assert.match(source, /createHabitCollection/);
  assert.match(source, /updateHabitCollection/);
  assert.match(source, /deleteHabitCollection/);

  // Reuses the centralized Railway/Auth request abstraction.
  assert.match(source, /requestProfileV1/);
  assert.doesNotMatch(source, /supabase\.auth\.getSession/);
  assert.doesNotMatch(source, /EXPO_PUBLIC_API_URL/);

  // Validates collections
  assert.match(source, /safeName/);
  assert.match(source, /safeDays/);
  assert.match(source, /expected_version/);
});

test('habitCollections.js function signatures', () => {
  const source = require('fs').readFileSync(
    require('path').resolve(__dirname, './habitCollections.js'),
    'utf8'
  );

  // listHabitCollections takes no parameters
  assert.match(source, /export\s+async\s+function\s+listHabitCollections\(\)\s*\{/);

  // getHabitCollection takes collectionId
  assert.match(source, /export\s+async\s+function\s+getHabitCollection\(collectionId\)/);

  // createHabitCollection takes payload
  assert.match(source, /export\s+async\s+function\s+createHabitCollection\(payload\)/);

  // updateHabitCollection takes collectionId and payload
  assert.match(source, /export\s+async\s+function\s+updateHabitCollection\(collectionId,\s*payload\)/);

  // deleteHabitCollection takes collectionId and expectedVersion
  assert.match(source, /export\s+async\s+function\s+deleteHabitCollection\(collectionId,\s*expectedVersion\)/);
});

test('habitCollections.js request paths', () => {
  const source = require('fs').readFileSync(
    require('path').resolve(__dirname, './habitCollections.js'),
    'utf8'
  );

  // listHabitCollections calls /v1/habit-collections
  assert.match(source, /\/v1\/habit-collections['"`]/);

  // GET method used for list
  assert.match(source, /method:\s*['"]GET['"]/);

  // PATCH method for update
  assert.match(source, /method:\s*['"]PATCH['"]/);

  // DELETE method for delete
  assert.match(source, /method:\s*['"]DELETE['"]/);
});

test('habitCollections.js preserves safe error metadata', () => {
  const source = require('fs').readFileSync(
    require('path').resolve(__dirname, './habitCollections.js'),
    'utf8'
  );

  assert.match(source, /status:\s*error\.status/);
  assert.match(source, /code:\s*error\.code/);
  assert.doesNotMatch(source, /payload\?\.error\?\.message/);
});

test('habitCollections.js no user_id in payload', () => {
  const source = require('fs').readFileSync(
    require('path').resolve(__dirname, './habitCollections.js'),
    'utf8'
  );

  // createHabitCollection does not add user_id to payload
  const createFunc = source.match(/export\s+async\s+function\s+createHabitCollection[\s\S]*?(?=export)/)?.[0] || '';
  assert.doesNotMatch(createFunc, /user_id:/);

  // updateHabitCollection does not add user_id to payload
  const updateFunc = source.match(/export\s+async\s+function\s+updateHabitCollection[\s\S]*?(?=export)/)?.[0] || '';
  assert.doesNotMatch(updateFunc, /user_id:/);
});

test('habitCollections.js normalizes collection data', () => {
  const source = require('fs').readFileSync(
    require('path').resolve(__dirname, './habitCollections.js'),
    'utf8'
  );

  // Normalizes days array
  assert.match(source, /normalizeCollectionDays/);

  // Normalizes collection object
  assert.match(source, /normalizeCollection\(payload\)/);

  // Handles members array
  assert.match(source, /members:\s*Array.isArray\(payload\.members\)/);
  assert.match(source, /linked_tool_route/);
  assert.match(source, /created_at/);
});

test('habitCollections.js sends the exact discriminated member contract', () => {
  const createSource = require('fs').readFileSync(
    require('path').resolve(__dirname, '../screens/HabitCollectionCreateScreen.jsx'),
    'utf8'
  );
  const editSource = require('fs').readFileSync(
    require('path').resolve(__dirname, '../screens/HabitCollectionEditScreen.jsx'),
    'utf8'
  );

  for (const screenSource of [createSource, editSource]) {
    assert.match(screenSource, /type:\s*['"]existing['"],\s*habit_id/);
    assert.match(screenSource, /type:\s*['"]new['"],\s*name/);
    assert.doesNotMatch(screenSource, /new_habit_name/);
  }
});

test('collection create and edit forms use explicit readable dark-theme text colors', () => {
  const fs = require('fs');
  const path = require('path');
  const createSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/HabitCollectionCreateScreen.jsx'),
    'utf8'
  );
  const editSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/HabitCollectionEditScreen.jsx'),
    'utf8'
  );

  for (const screenSource of [createSource, editSource]) {
    assert.match(screenSource, /input:\s*\{[\s\S]*?color:\s*COLORS\.textPrimary/);
    assert.match(screenSource, /habitName:\s*\{[\s\S]*?color:\s*COLORS\.textPrimary/);
    assert.match(screenSource, /memberName:\s*\{[\s\S]*?color:\s*COLORS\.textPrimary/);
    assert.match(screenSource, /placeholderTextColor=\{COLORS\.textDim\}/);
    assert.match(screenSource, /habitOptionSelected:[\s\S]*?backgroundColor:/);
    assert.doesNotMatch(screenSource, /color:\s*COLORS\.text[,\n]/);
  }
});

test('collection color correction leaves create and edit payload contracts intact', () => {
  const fs = require('fs');
  const path = require('path');
  const sources = [
    fs.readFileSync(path.resolve(__dirname, '../screens/HabitCollectionCreateScreen.jsx'), 'utf8'),
    fs.readFileSync(path.resolve(__dirname, '../screens/HabitCollectionEditScreen.jsx'), 'utf8'),
  ];

  for (const screenSource of sources) {
    assert.match(screenSource, /type:\s*['"]existing['"],\s*habit_id/);
    assert.match(screenSource, /type:\s*['"]new['"],\s*name/);
    assert.doesNotMatch(screenSource, /new_habit_name/);
  }
});

test('all collection screens reuse the Habit overview background source and overlay', () => {
  const fs = require('fs');
  const path = require('path');
  const screenFiles = [
    'HabitCollectionsScreen.jsx',
    'HabitCollectionCreateScreen.jsx',
    'HabitCollectionScreen.jsx',
    'HabitCollectionEditScreen.jsx',
  ];

  for (const screenFile of screenFiles) {
    const screenSource = fs.readFileSync(
      path.resolve(__dirname, `../screens/${screenFile}`),
      'utf8'
    );
    assert.match(screenSource, /import \{ HABITS_PAGE_BG \} from ['"]\.\.\/\.\.\/\.\.\/\.\.\/constants\/toolAssets['"]/);
    assert.match(screenSource, /<ImageBackground[\s\S]*?source=\{HABITS_PAGE_BG\}/);
    assert.match(screenSource, /imageStyle=\{habitStyles\.backgroundImage\}/);
    assert.match(screenSource, /resizeMode="cover"/);
    assert.match(screenSource, /style=\{habitStyles\.pageOverlay\} pointerEvents="none"/);
  }
});

test('collection form background keeps keyboard avoidance and scrolling intact', () => {
  const fs = require('fs');
  const path = require('path');
  for (const screenFile of [
    'HabitCollectionCreateScreen.jsx',
    'HabitCollectionEditScreen.jsx',
  ]) {
    const screenSource = fs.readFileSync(
      path.resolve(__dirname, `../screens/${screenFile}`),
      'utf8'
    );
    assert.match(screenSource, /<KeyboardAvoidingView/);
    assert.match(screenSource, /<ScrollView/);
  }
});

test('collection edit guards every initially optional array and renders controlled errors', () => {
  const fs = require('fs');
  const path = require('path');
  const editSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/HabitCollectionEditScreen.jsx'),
    'utf8'
  );
  const hookSource = fs.readFileSync(
    path.resolve(__dirname, '../hooks/useHabitCollection.js'),
    'utf8'
  );

  assert.match(editSource, /Array\.isArray\(collection\.members\) \? collection\.members : \[\]/);
  assert.match(editSource, /Array\.isArray\(collections\) \? collections : \[\]/);
  assert.match(editSource, /Array\.isArray\(habits\) \? habits : \[\]/);
  assert.match(editSource, /Array\.isArray\(item\?\.members\) \? item\.members : \[\]/);
  assert.match(editSource, /showCollectionLoading \|\| showHabitsLoading/);
  assert.match(editSource, /\) : loadError \? \(/);
  assert.match(hookSource, /setLoadError\('Ungültige Sammlung\.'\)/);
  assert.match(hookSource, /members: Array\.isArray\(payload\.members\) \? payload\.members : \[\]/);
});

test('collection detail and management use explicit readable Habit colors', () => {
  const fs = require('fs');
  const path = require('path');
  const detailSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/HabitCollectionScreen.jsx'),
    'utf8'
  );
  const managementSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/HabitCollectionsScreen.jsx'),
    'utf8'
  );

  assert.match(detailSource, /headerTitle:\s*\{[\s\S]*?color: COLORS\.textPrimary/);
  assert.match(managementSource, /backgroundColor: 'rgba\(10,10,12,0\.72\)'/);
  assert.match(managementSource, /borderColor: COLORS\.goldBorder/);
  assert.match(managementSource, /color: COLORS\.white/);
  assert.doesNotMatch(detailSource, /color: COLORS\.text[,\n]/);
  assert.doesNotMatch(managementSource, /COLORS\.(?:cardBg|cardBorder|text)[,\n]/);
});

test('collection detail uses the same parent content padding and list spacing as overview habits', () => {
  const fs = require('fs');
  const path = require('path');
  const detailSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/HabitCollectionScreen.jsx'),
    'utf8'
  );
  const overviewSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/HabitScreen.jsx'),
    'utf8'
  );

  assert.match(detailSource, /contentContainerStyle=\{habitStyles\.content\}/);
  assert.match(detailSource, /contentContainerStyle=\{habitStyles\.list\}/);
  assert.match(overviewSource, /contentContainerStyle=\{styles\.content\}/);
  assert.match(overviewSource, /<View style=\{styles\.list\}>/);
});

test('collection detail resolves off-day members from the complete owner-bound habit list', () => {
  const fs = require('fs');
  const path = require('path');
  const detailSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/HabitCollectionScreen.jsx'),
    'utf8'
  );

  assert.match(detailSource, /const \{[\s\S]*?habits,[\s\S]*?completedIds: allCompletedIds,[\s\S]*?toggle,[\s\S]*?\} = useHabits\(selectedDay\)/);
  assert.match(detailSource, /collection\.members[\s\S]*?\.map\(m => habits\.find\(h => h\.id === m\.habit_id\)\)[\s\S]*?\.filter\(Boolean\)/);
  assert.doesNotMatch(detailSource, /\.map\(m => visibleHabits\.find/);
});

test('collection detail keeps today completion state and the existing toggle worker', () => {
  const fs = require('fs');
  const path = require('path');
  const detailSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/HabitCollectionScreen.jsx'),
    'utf8'
  );

  assert.match(detailSource, /const selectedDay = getTodayIndex\(\)/);
  assert.match(detailSource, /done=\{allCompletedIds\.has\(habit\.id\)\}/);
  assert.match(detailSource, /partitionHabitsByCompletion\(memberHabits, allCompletedIds\)/);
  assert.match(detailSource, /LayoutAnimation\.configureNext\(LayoutAnimation\.Presets\.easeInEaseOut\)[\s\S]*?toggle\(habitId\)/);
  assert.match(detailSource, /onToggle=\{handleToggleMember\}/);
  assert.doesNotMatch(detailSource, /toggleCompletion|supabase\.(?:from|rpc)/);
});

test('create and edit use the same scaled gap below all-days selection', () => {
  const fs = require('fs');
  const path = require('path');
  for (const screenFile of [
    'HabitCollectionCreateScreen.jsx',
    'HabitCollectionEditScreen.jsx',
  ]) {
    const source = fs.readFileSync(path.resolve(__dirname, `../screens/${screenFile}`), 'utf8');
    assert.match(source, /daysContainer:\s*\{[\s\S]*?marginBottom: sv\(10\)/);
  }
});
