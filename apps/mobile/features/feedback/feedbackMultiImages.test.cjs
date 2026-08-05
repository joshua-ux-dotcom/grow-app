const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { transformFileSync } = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');

function transform(filename, mocks, jsx = false) {
  const code = transformFileSync(filename, { babelrc: false, configFile: false,
    presets: jsx ? ['@babel/preset-react'] : [], plugins: [commonjs] }).code;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(request => mocks[request] || require(request), module, module.exports);
  return module.exports;
}

function loadHookHelpers() {
  return transform(path.resolve(__dirname, 'hooks/useFeedbackForm.js'), {
    react: { useCallback() {}, useEffect() {}, useRef() {}, useState() {} },
    'react-native': { Alert: {} }, 'expo-image-picker': {}, '../services/feedbackService': {},
    '../../../services/supabaseClient': {}, '../../../lib/logger': {},
  });
}

const asset = (id, size) => ({ assetId: id, uri: `file://${id}`, base64: 'AA==', fileSize: size, fileName: `${id}.jpg` });

test('remaining capacity is exact from zero through five', () => {
  const hook = loadHookHelpers();
  assert.deepEqual(Array.from({ length: 6 }, (_, count) => hook.getFeedbackImageRemainingCapacity(count)), [5, 4, 3, 2, 1, 0]);
});

test('selection preserves order, deduplicates across openings and removes individually', () => {
  const hook = loadHookHelpers();
  const first = hook.prepareFeedbackImageSelection([], [asset('a', 1), asset('b', 1)]).images;
  const second = hook.prepareFeedbackImageSelection(first, [asset('a', 1), asset('c', 1)]).images;
  assert.deepEqual(second.map(image => image.assetId), ['a', 'b', 'c']);
  assert.deepEqual(hook.removeFeedbackImage(second, 1).map(image => image.assetId), ['a', 'c']);
});

test('size boundaries and unknown or malformed sizes are handled explicitly', () => {
  const hook = loadHookHelpers();
  const mib = 1024 * 1024;
  assert.equal(hook.prepareFeedbackImageSelection([], [asset('a', 5 * mib)]).error, null);
  assert.equal(hook.prepareFeedbackImageSelection([], [asset('a', 5 * mib + 1)]).error, 'file-too-large');
  assert.equal(hook.prepareFeedbackImageSelection([], [asset('a', 5 * mib), asset('b', 5 * mib), asset('c', 5 * mib)]).error, null);
  assert.equal(hook.prepareFeedbackImageSelection([], [asset('a', 5 * mib), asset('b', 5 * mib), asset('c', 5 * mib), asset('d', 1)]).error, 'total-too-large');
  assert.equal(hook.prepareFeedbackImageSelection([], [asset('a', null), asset('b', undefined)]).error, null);
  for (const size of [-1, NaN, Infinity, '10']) assert.equal(hook.prepareFeedbackImageSelection([], [asset('bad', size)]).error, 'invalid-size');
});

function createHookHarness() {
  const slots = []; let cursor = 0; let permissionCalls = 0; let pickerCalls = 0;
  const picker = { permission: { granted: true }, result: { canceled: true }, deferred: null };
  const send = { error: null, calls: [] };
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useEffect() { cursor += 1; }, useCallback(fn) { cursor += 1; return fn; },
  };
  const ImagePicker = {
    requestMediaLibraryPermissionsAsync: async () => { permissionCalls += 1; return picker.permission; },
    launchImageLibraryAsync: async () => { pickerCalls += 1; return picker.deferred ? picker.deferred.promise : picker.result; },
  };
  const module = transform(path.resolve(__dirname, 'hooks/useFeedbackForm.js'), {
    react, 'react-native': { Alert: { alert() {} } }, 'expo-image-picker': ImagePicker,
    '../services/feedbackService': { sendFeedback: async payload => { send.calls.push(payload); if (send.error) throw send.error; return {}; } },
    '../../../services/supabaseClient': { supabase: { auth: { getUser: async () => ({ data: { user: { id: 'owner' } }, error: null }) } } },
    '../../../lib/logger': { logger: { debug() {} } },
  });
  return { picker, send, render() { cursor = 0; return module.useFeedbackForm(); }, counts: () => ({ permissionCalls, pickerCalls }) };
}

test('permission denial and cancellation preserve images; re-entrant picker is blocked', async () => {
  const harness = createHookHarness(); let form = harness.render();
  harness.picker.result = { canceled: false, assets: [asset('a', 1)] };
  await form.handlePickImage(); form = harness.render(); assert.equal(form.selectedImages.length, 1);
  harness.picker.result = { canceled: true }; await form.handlePickImage(); form = harness.render(); assert.equal(form.selectedImages.length, 1);
  harness.picker.permission = { granted: false }; await form.handlePickImage(); form = harness.render(); assert.equal(form.selectedImages.length, 1);
  harness.picker.permission = { granted: true };
  let resolve; harness.picker.deferred = { promise: new Promise(value => { resolve = value; }) };
  const first = form.handlePickImage(); const second = form.handlePickImage(); resolve({ canceled: true }); await Promise.all([first, second]);
  assert.equal(harness.counts().pickerCalls, 3);
});

test('failed submission keeps images and successful submission clears them', async () => {
  const harness = createHookHarness(); let form = harness.render();
  harness.picker.result = { canceled: false, assets: [asset('a', 1)] }; await form.handlePickImage();
  form = harness.render(); form.setText('Feedback'); form = harness.render();
  harness.send.error = new Error('failed'); await form.handleSend(); form = harness.render(); assert.equal(form.selectedImages.length, 1);
  harness.send.error = null; await form.handleSend(); form = harness.render(); assert.equal(form.selectedImages.length, 0);
});

test('admin normalization parses JSON, deduplicates in order and safely falls back', () => {
  const service = transform(path.resolve(__dirname, '../admin/services/adminFeedback.js'), {
    '../../../services/supabaseClient': { supabase: {} }, '../../../lib/logger': { logger: { error() {} } },
  });
  const modern = service.normalizeAdminFeedbackItem({ feedback: JSON.stringify({
    image_urls: JSON.stringify(['https://b', 'https://a', 'https://b', '', 'bucket/path']),
    image_paths: JSON.stringify(['u/b', 'u/a', 'u/b']), image_url: 'https://legacy', image_path: 'u/legacy',
  }) });
  assert.deepEqual(modern.imageUrls, ['https://b', 'https://a']); assert.deepEqual(modern.imagePaths, ['u/b', 'u/a']);
  assert.deepEqual(service.normalizeAdminFeedbackItem({ feedback: '{bad' }).imageUrls, []);
  assert.deepEqual(service.normalizeAdminFeedbackItem({ feedback: { image_urls: '[]', image_url: 'https://legacy', image_paths: '[]', image_path: 'u/legacy' } }).imageUrls, ['https://legacy']);
  assert.deepEqual(service.normalizeAdminFeedbackItem({ feedback: { image_path: 'u/private' } }).imageUrls, []);
});

test('admin deletion cleanup is deduplicated and never changes successful RPC result', async () => {
  const cases = [{ remove: async () => ({ error: new Error('returned') }) }, { remove: async () => { throw new Error('thrown'); } }, { remove: async () => ({ error: null }) }];
  for (const bucket of cases) {
    const removals = []; const original = bucket.remove; bucket.remove = async paths => { removals.push(paths); return original(paths); };
    const service = transform(path.resolve(__dirname, '../admin/services/adminFeedback.js'), {
      '../../../services/supabaseClient': { supabase: { rpc: async () => ({ error: null }), storage: { from: () => bucket } } },
      '../../../lib/logger': { logger: { error() {} } },
    });
    await assert.doesNotReject(service.deleteAdminFeedback('id', ['u/a', 'u/a', 'u/b']));
    assert.deepEqual(removals, [['u/a', 'u/b']]);
    removals.length = 0; await service.deleteAdminFeedback('id', []); assert.deepEqual(removals, []);
  }
});

test('lightbox helpers clamp indexes and reposition for reopen or width changes', () => {
  const lightbox = transform(path.resolve(__dirname, '../../components/ImageLightboxModal.jsx'), {
    react: { useEffect() {}, useRef() {}, useState() {} },
    'react-native': { StyleSheet: { create: value => value } },
  }, true);
  assert.equal(lightbox.clampLightboxIndex(8, 3), 2);
  assert.equal(lightbox.clampLightboxIndex(-1, 3), 0);
  assert.equal(lightbox.getLightboxOffset(2, 390, 3), 780);
  assert.equal(lightbox.getLightboxOffset(2, 844, 3), 1688);
  assert.equal(lightbox.getLightboxIndexFromOffset(844, 390, 5), 2);
});
