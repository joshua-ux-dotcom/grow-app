const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { transformFileSync } = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');

function loadService() {
  const filename = path.resolve(__dirname, 'feedbackService.js');
  const code = transformFileSync(filename, { babelrc: false, configFile: false, plugins: [commonjs] }).code;
  const module = { exports: {} };
  const mocks = {
    '../../../lib/logger': { logger: { debug() {}, error() {} } },
    '../../../services/supabaseClient': { supabase: {} },
  };
  new Function('require', 'module', 'exports', code)(request => mocks[request] || require(request), module, module.exports);
  return module.exports;
}

function setup({ uploadFailureAt, uploadThrows = false, publicUrlFailureAt, publicUrlThrows = false, publicUrlThrownError, insertError, cleanupError, cleanupThrows = false } = {}) {
  const calls = [];
  let uploadCount = 0;
  let publicCount = 0;
  const bucket = {
    upload: async (filePath, bytes, options) => {
      uploadCount += 1; calls.push(['upload', filePath, bytes, options]);
      if (uploadCount === uploadFailureAt && uploadThrows) throw new Error(`upload-${uploadCount}`);
      return { error: uploadCount === uploadFailureAt ? new Error(`upload-${uploadCount}`) : null };
    },
    getPublicUrl: filePath => {
      publicCount += 1; calls.push(['publicUrl', filePath]);
      if (publicCount === publicUrlFailureAt && publicUrlThrows) throw (publicUrlThrownError ?? new Error('public-url-thrown'));
      if (publicCount === publicUrlFailureAt) return { data: {} };
      return { data: { publicUrl: `https://cdn.test/${filePath}` } };
    },
    remove: async paths => {
      calls.push(['remove', paths]);
      if (cleanupThrows) throw new Error('cleanup-thrown');
      return { error: cleanupError ? new Error('cleanup-returned') : null };
    },
  };
  const client = {
    storage: { from: bucketName => { calls.push(['bucket', bucketName]); return bucket; } },
    from: table => ({ insert: async payload => { calls.push(['insert', table, payload]); return { error: insertError }; } }),
    rpc: async name => { calls.push(['rpc', name]); return { data: true, error: null }; },
  };
  let name = 0;
  return { calls, client, createFileName: () => `generated-${++name}` };
}

const image = (index, overrides = {}) => ({
  uri: `file://${index}`, base64: 'AQID', fileName: `${index}.jpg`, mimeType: 'image/jpeg', ...overrides,
});
const input = selectedImages => ({ userId: 'owner', selectedType: 'Idee', selectedImportance: 4, text: 'Hallo', selectedImages });

test('filename generator is runtime-independent, formatted and unique', () => {
  const service = loadService();
  const names = new Set(Array.from({ length: 100 }, () => service.createFeedbackImageFileName({ now: () => 123, random: () => 0.5 })));
  assert.equal(names.size, 100);
  for (const name of names) assert.match(name, /^feedback-[a-z0-9]+-[a-z0-9]+-[a-z0-9]{40,}$/);
});

test('extension and MIME fallbacks are safe', () => {
  const service = loadService();
  assert.equal(service.getSafeFeedbackFileExtension('x.PNG', 'image/jpeg'), 'png');
  assert.equal(service.getSafeFeedbackFileExtension('x.exe', 'image/webp'), 'webp');
  assert.equal(service.getSafeFeedbackFileExtension(null, 'image/jpeg'), 'jpg');
});

test('zero, one and five images write ordered arrays and matching legacy fields', async () => {
  const service = loadService();
  for (const count of [0, 1, 5]) {
    const env = setup();
    const decoded = [];
    await service.sendFeedback(input(Array.from({ length: count }, (_, index) => image(index))), {
      ...env, decodeBase64: value => { const result = require('base64-arraybuffer').decode(value); decoded.push(result); return result; },
    });
    const payload = env.calls.find(call => call[0] === 'insert')[2];
    assert.equal(env.calls.filter(call => call[0] === 'upload').length, count);
    assert.equal(decoded.every(value => value instanceof ArrayBuffer), true);
    if (!count) {
      assert.deepEqual([payload.image_urls, payload.image_paths, payload.image_url, payload.image_path], [null, null, null, null]);
    } else {
      assert.deepEqual(payload.image_paths, Array.from({ length: count }, (_, index) => `owner/generated-${index + 1}.jpg`));
      assert.equal(new Set(payload.image_paths).size, count);
      assert.equal(payload.image_url, payload.image_urls[0]);
      assert.equal(payload.image_path, payload.image_paths[0]);
    }
  }
});

test('rejects more than five and malformed images before insert', async () => {
  const service = loadService();
  for (const images of [Array.from({ length: 6 }, (_, index) => image(index)), [{ uri: 'file://bad' }]]) {
    const env = setup();
    await assert.rejects(service.sendFeedback(input(images), env));
    assert.equal(env.calls.some(call => call[0] === 'insert'), false);
  }
});

test('prevalidates the complete array before paths, storage or cleanup', async () => {
  const service = loadService();
  const valid = image(1);
  const malformed = { uri: 'file://bad', base64: '   ' };
  for (const images of [[malformed, valid, valid], [valid, malformed, valid], [valid, valid, malformed]]) {
    const env = setup();
    let generatedNames = 0;
    await assert.rejects(service.sendFeedback(input(images), {
      ...env, createFileName: () => { generatedNames += 1; return `generated-${generatedNames}`; },
    }), /malformed/);
    assert.equal(generatedNames, 0);
    assert.deepEqual(env.calls, []);
  }
});

test('uploads sequentially with upsert false', async () => {
  const service = loadService();
  const env = setup();
  await service.sendFeedback(input([image(1), image(2)]), env);
  assert.deepEqual(env.calls.filter(call => call[0] === 'upload').map(call => call[1]), ['owner/generated-1.jpg', 'owner/generated-2.jpg']);
  assert.equal(env.calls.filter(call => call[0] === 'upload').every(call => call[3].upsert === false), true);
  assert.ok(env.calls.findIndex(call => call[0] === 'publicUrl' && call[1].includes('generated-1')) < env.calls.findIndex(call => call[0] === 'upload' && call[1].includes('generated-2')));
});

test('every returned or thrown upload failure cleans all attempted paths including N', async () => {
  const service = loadService();
  for (const uploadThrows of [false, true]) for (const position of [1, 2, 3, 4, 5]) {
    const env = setup({ uploadFailureAt: position, uploadThrows });
    const expected = new RegExp(`upload-${position}`);
    await assert.rejects(service.sendFeedback(input([image(1), image(2), image(3), image(4), image(5)]), env), expected);
    assert.deepEqual(env.calls.find(call => call[0] === 'remove')[1], Array.from({ length: position }, (_, index) => `owner/generated-${index + 1}.jpg`));
  }
});

test('public URL and insert failures clean all attempted paths', async () => {
  const service = loadService();
  const publicFailure = setup({ publicUrlFailureAt: 2 });
  await assert.rejects(service.sendFeedback(input([image(1), image(2)]), publicFailure), /public URL/);
  assert.deepEqual(publicFailure.calls.find(call => call[0] === 'remove')[1], ['owner/generated-1.jpg', 'owner/generated-2.jpg']);
  const thrownPublicFailure = setup({ publicUrlFailureAt: 2, publicUrlThrows: true });
  await assert.rejects(service.sendFeedback(input([image(1), image(2)]), thrownPublicFailure), /public-url-thrown/);
  assert.deepEqual(thrownPublicFailure.calls.find(call => call[0] === 'remove')[1], ['owner/generated-1.jpg', 'owner/generated-2.jpg']);
  const insertFailure = setup({ insertError: new Error('insert-original') });
  await assert.rejects(service.sendFeedback(input([image(1), image(2)]), insertFailure), /insert-original/);
  assert.deepEqual(insertFailure.calls.find(call => call[0] === 'remove')[1], ['owner/generated-1.jpg', 'owner/generated-2.jpg']);
});

test('thrown and returned cleanup failures preserve the original failure', async () => {
  const service = loadService();
  for (const options of [{ cleanupError: true }, { cleanupThrows: true }]) {
    const env = setup({ uploadFailureAt: 1, ...options });
    await assert.rejects(service.sendFeedback(input([image(1)]), env), /upload-1/);
  }
});

test('cleanup failures after public URL failure preserve the original error and ordered paths', async () => {
  const service = loadService();
  for (const cleanup of [{ cleanupError: true }, { cleanupThrows: true }]) {
    const returned = setup({ publicUrlFailureAt: 2, ...cleanup });
    await assert.rejects(service.sendFeedback(input([image(1), image(2)]), returned), error => error.message === 'Feedback image public URL is missing.');
    assert.deepEqual(returned.calls.find(call => call[0] === 'remove')[1], ['owner/generated-1.jpg', 'owner/generated-2.jpg']);

    const original = new Error('public-original');
    const thrown = setup({ publicUrlFailureAt: 2, publicUrlThrows: true, publicUrlThrownError: original, ...cleanup });
    await assert.rejects(service.sendFeedback(input([image(1), image(2)]), thrown), error => error === original);
    assert.deepEqual(thrown.calls.find(call => call[0] === 'remove')[1], ['owner/generated-1.jpg', 'owner/generated-2.jpg']);
  }
});

test('cleanup failures after insert failure preserve the original error and ordered paths', async () => {
  const service = loadService();
  for (const cleanup of [{ cleanupError: true }, { cleanupThrows: true }]) {
    const original = new Error('insert-original');
    const env = setup({ insertError: original, ...cleanup });
    await assert.rejects(service.sendFeedback(input([image(1), image(2)]), env), error => error === original);
    assert.deepEqual(env.calls.find(call => call[0] === 'remove')[1], ['owner/generated-1.jpg', 'owner/generated-2.jpg']);
  }
});
