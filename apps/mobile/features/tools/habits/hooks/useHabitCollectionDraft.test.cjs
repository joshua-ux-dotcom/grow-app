const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { transformFileSync } = require('@babel/core');
const transformModulesCommonJs = require('@babel/plugin-transform-modules-commonjs');

const filename = path.resolve(
  __dirname,
  '../services/habitCollectionDrafts.js'
);
const code = transformFileSync(filename, {
  babelrc: false,
  configFile: false,
  plugins: [transformModulesCommonJs],
}).code;
const loadedModule = { exports: {} };
new Function('require', 'module', 'exports', '__filename', '__dirname', code)(
  request => (
    request === '@react-native-async-storage/async-storage'
      ? {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      }
      : require(request)
  ),
  loadedModule,
  loadedModule.exports,
  filename,
  path.dirname(filename)
);

const {
  createEmptyHabitCollectionSnapshot,
  createHabitCollectionDraftSession,
  createHabitCollectionLeaveController,
  createHabitCollectionLeaveOrchestrator,
  createHabitCollectionLeaveOptions,
  createHabitCollectionNavigationController,
  dismissHabitCollectionEditToDetail,
  dismissHabitCollectionsToOverview,
  sanitizeHabitCollectionSnapshot,
} = loadedModule.exports;

const draft = {
  name: 'Morgenroutine',
  days: [1, 2, 3],
  selectedHabitIds: ['habit-a'],
  newHabits: [{ tempId: 'new-1', name: 'Wasser' }],
  memberOrder: ['habit-a', 'new-1'],
  newHabitName: 'Noch offen',
};

function createFakeTimers() {
  let nextId = 1;
  const timers = new Map();
  return {
    schedule(callback) {
      const id = nextId;
      nextId += 1;
      timers.set(id, callback);
      return id;
    },
    cancel(id) {
      timers.delete(id);
    },
    async runAll() {
      const callbacks = Array.from(timers.values());
      timers.clear();
      callbacks.forEach(callback => callback());
      await new Promise(resolve => setImmediate(resolve));
    },
    size() {
      return timers.size;
    },
  };
}

async function createCollectionDeleteHookRuntime({
  failOwnerCheck = false,
  initialDeleteError = null,
} = {}) {
  const hookFilename = path.resolve(__dirname, './useHabitCollections.js');
  const hookCode = transformFileSync(hookFilename, {
    babelrc: false,
    configFile: false,
    plugins: [transformModulesCommonJs],
  }).code;
  const effects = [];
  let ownerChecks = 0;
  let deleteCalls = 0;
  let deleteError = initialDeleteError;
  const react = {
    useCallback: callback => callback,
    useEffect: callback => effects.push(callback),
    useRef: initialValue => ({ current: initialValue }),
    useState: initialValue => {
      let value = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [value, update => {
        value = typeof update === 'function' ? update(value) : update;
      }];
    },
  };
  const hookModule = { exports: {} };
  new Function('require', 'module', 'exports', '__filename', '__dirname', hookCode)(
    request => {
      const mocks = {
        react,
        '../services/habitCollections': {
          listHabitCollections: async () => [],
          updateHabitCollection: async () => null,
          createHabitCollection: async () => null,
          deleteHabitCollection: async () => {
            deleteCalls += 1;
            if (deleteError) throw deleteError;
          },
        },
        '../../../../services/authUser': {
          getCurrentUserId: async () => {
            ownerChecks += 1;
            if (failOwnerCheck && ownerChecks > 1) {
              throw new Error('owner unavailable');
            }
            return 'owner-a';
          },
        },
        '../../../../services/supabaseClient': {
          supabase: {
            auth: {
              onAuthStateChange: () => ({
                data: { subscription: { unsubscribe() {} } },
              }),
            },
          },
        },
      };
      return Object.prototype.hasOwnProperty.call(mocks, request)
        ? mocks[request]
        : require(request);
    },
    hookModule,
    hookModule.exports,
    hookFilename,
    path.dirname(hookFilename)
  );
  const result = hookModule.exports.useHabitCollections();
  effects.forEach(effect => effect());
  await new Promise(resolve => setImmediate(resolve));

  return {
    result,
    get deleteCalls() {
      return deleteCalls;
    },
    setDeleteError(error) {
      deleteError = error;
    },
  };
}

function createDismissRouter(stack) {
  return {
    dismissTo(href) {
      const index = stack.findIndex(route => route === href);
      if (index >= 0) stack.splice(index + 1);
    },
  };
}

function createRuntime(overrides = {}) {
  const writes = [];
  const removes = [];
  const timers = createFakeTimers();
  const baseline = overrides.baseline ?? createEmptyHabitCollectionSnapshot();
  const session = createHabitCollectionDraftSession({
    key: overrides.key ?? '@draft/user/create',
    baseline,
    loadDraft: overrides.loadDraft ?? (async () => ({
      status: 'missing',
      snapshot: null,
    })),
    saveDraft: overrides.saveDraft ?? (async (key, snapshot) => {
      writes.push({ key, snapshot });
      return true;
    }),
    removeDraft: overrides.removeDraft ?? (async key => {
      removes.push(key);
      return true;
    }),
    schedule: timers.schedule,
    cancelSchedule: timers.cancel,
    writeDelayMs: 350,
  });
  return { session, baseline, writes, removes, timers };
}

function createLeaveOrchestratorRuntime(session, { autoDrain = true } = {}) {
  let currentSession = session;
  let currentLeaveController = createHabitCollectionLeaveController();
  const actions = [];
  const callbacks = [];
  const errors = [];
  const settledNavigations = [];
  let guardBypassed = false;
  let navigationController;
  const drainNavigation = () => navigationController.drain(action => {
    actions.push(action);
  });
  navigationController = createHabitCollectionNavigationController({
    getCurrentSession: () => currentSession,
    getCurrentLeaveController: () => currentLeaveController,
    onPending: () => {
      guardBypassed = true;
      if (autoDrain) drainNavigation();
    },
    onSettled: result => {
      settledNavigations.push(result);
      if (result.releaseGuardBypass) guardBypassed = false;
    },
  });
  const orchestrator = createHabitCollectionLeaveOrchestrator({
    getCurrentSession: () => currentSession,
    getCurrentLeaveController: () => currentLeaveController,
    queueNavigationAction: (ownerSession, ownerController, action) => (
      navigationController.enqueueAction(ownerSession, ownerController, action)
    ),
    queueNavigationCallback: (ownerSession, ownerController, navigate) => {
      callbacks.push(navigate);
      return navigationController.enqueueCallback(
        ownerSession,
        ownerController,
        navigate
      );
    },
    onStorageError: error => errors.push(error),
  });

  return {
    orchestrator,
    actions,
    callbacks,
    errors,
    settledNavigations,
    drainNavigation,
    navigationController,
    get session() {
      return currentSession;
    },
    get leaveController() {
      return currentLeaveController;
    },
    get guardBypassed() {
      return guardBypassed;
    },
    switchSession(nextSession) {
      currentSession = nextSession;
      currentLeaveController = createHabitCollectionLeaveController();
      orchestrator.resetForCurrentSession();
    },
    unmount() {
      currentSession = null;
      currentLeaveController = null;
    },
  };
}

test('hydration restores a draft before activation or persistence', async () => {
  const runtime = createRuntime({
    loadDraft: async () => ({ status: 'valid', snapshot: draft }),
  });

  const restored = await runtime.session.hydrate();

  assert.equal(restored.status, 'ready');
  assert.equal(restored.snapshot.name, 'Morgenroutine');
  assert.equal(runtime.writes.length, 0);
  assert.equal(runtime.removes.length, 0);
  runtime.session.activate(restored.snapshot);
  assert.equal(runtime.writes.length, 0);
});

test('two operational load failures expose an error and manual retry can hydrate', async () => {
  let attempts = 0;
  const runtime = createRuntime({
    loadDraft: async () => {
      attempts += 1;
      if (attempts <= 2) throw new Error('read failed');
      return { status: 'valid', snapshot: draft };
    },
  });

  const failed = await runtime.session.hydrate();
  assert.equal(failed.status, 'error');
  assert.equal(attempts, 2);
  assert.equal(runtime.writes.length, 0);
  assert.equal(runtime.removes.length, 0);

  const retried = await runtime.session.hydrate();
  assert.equal(retried.status, 'ready');
  assert.equal(retried.snapshot.name, 'Morgenroutine');
  assert.equal(attempts, 3);
});

test('closing during hydration ignores the late load result', async () => {
  let resolveLoad;
  const runtime = createRuntime({
    loadDraft: () => new Promise(resolve => {
      resolveLoad = resolve;
    }),
  });

  const hydration = runtime.session.hydrate();
  await new Promise(resolve => setImmediate(resolve));
  await runtime.session.close();
  resolveLoad({ status: 'valid', snapshot: draft });

  assert.equal((await hydration).status, 'terminal');
  assert.equal(runtime.writes.length, 0);
});

test('debounce writes only the latest dirty snapshot', async () => {
  const runtime = createRuntime();
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update({ ...draft, name: 'First' });
  runtime.session.update({ ...draft, name: 'Latest' });

  assert.equal(runtime.timers.size(), 1);
  await runtime.timers.runAll();

  assert.equal(runtime.writes.length, 1);
  assert.equal(runtime.writes[0].snapshot.name, 'Latest');
});

test('explicit flush cancels debounce and writes the latest snapshot', async () => {
  const runtime = createRuntime();
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);

  assert.equal(await runtime.session.flush(), true);
  assert.equal(runtime.timers.size(), 0);
  assert.equal(runtime.writes.length, 1);
  assert.equal(runtime.writes[0].snapshot.name, 'Morgenroutine');
});

test('key switch closes with only the old key and old snapshot', async () => {
  const oldRuntime = createRuntime({ key: '@draft/user/edit/old' });
  const restored = await oldRuntime.session.hydrate();
  oldRuntime.session.activate(restored.snapshot);
  oldRuntime.session.update({ ...draft, name: 'Old session snapshot' });
  oldRuntime.session.replaceSnapshot({ ...draft, name: 'Old final snapshot' });

  await oldRuntime.session.close();

  assert.deepEqual(oldRuntime.writes.map(write => ({
    key: write.key,
    name: write.snapshot.name,
  })), [{
    key: '@draft/user/edit/old',
    name: 'Old final snapshot',
  }]);
});

test('unexpected unmount close flushes the latest old-session snapshot', async () => {
  const runtime = createRuntime({ key: '@draft/user/create' });
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update({ ...draft, name: 'Before unmount' });
  runtime.session.replaceSnapshot({ ...draft, name: 'At unmount' });

  await runtime.session.close();

  assert.equal(runtime.timers.size(), 0);
  assert.equal(runtime.writes.length, 1);
  assert.equal(runtime.writes[0].key, '@draft/user/create');
  assert.equal(runtime.writes[0].snapshot.name, 'At unmount');
});

test('stale habit ids are sanitized before activation and persistence', async () => {
  const runtime = createRuntime({
    loadDraft: async () => ({
      status: 'valid',
      snapshot: {
        ...draft,
        selectedHabitIds: ['habit-a', 'stale'],
        memberOrder: ['stale', 'new-1', 'habit-a'],
      },
    }),
  });
  const restored = await runtime.session.hydrate();
  const sanitized = sanitizeHabitCollectionSnapshot(
    restored.snapshot,
    new Set(['habit-a'])
  );
  runtime.session.replaceSnapshot(sanitized);
  runtime.session.activate(sanitized);
  runtime.session.update({ ...sanitized, name: 'Sanitized' });
  await runtime.session.flush();

  assert.deepEqual(runtime.writes[0].snapshot.selectedHabitIds, ['habit-a']);
  assert.deepEqual(runtime.writes[0].snapshot.memberOrder, ['new-1', 'habit-a']);
});

test('unchanged normalized baseline is not dirty', async () => {
  const baseline = { ...draft, days: [3, 1, 2] };
  const runtime = createRuntime({ baseline });
  const restored = await runtime.session.hydrate();
  runtime.session.activate({ ...restored.snapshot, days: [1, 2, 3, 2] });

  assert.equal(runtime.session.getState().dirty, false);
});

test('discard removes once, becomes terminal and cannot recreate a draft', async () => {
  const runtime = createRuntime();
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);

  assert.equal(await runtime.session.discard(), true);
  assert.equal(runtime.session.getState().terminal, true);
  assert.equal(runtime.session.update({ ...draft, name: 'Too late' }), false);
  await runtime.session.close();
  await runtime.timers.runAll();
  assert.deepEqual(runtime.removes, ['@draft/user/create']);
  assert.equal(runtime.writes.length, 0);
});

test('discard failure remains retryable and does not navigate', async () => {
  let shouldFail = true;
  const runtime = createRuntime({
    removeDraft: async () => {
      if (shouldFail) throw new Error('remove failed');
      return true;
    },
  });
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createHabitCollectionLeaveController();
  let navigations = 0;

  await assert.rejects(() => leave.run(
    () => runtime.session.discard(),
    () => {
      navigations += 1;
    }
  ));
  assert.equal(navigations, 0);
  assert.equal(runtime.session.getState().terminal, false);

  shouldFail = false;
  assert.equal(await leave.run(
    () => runtime.session.discard(),
    () => {
      navigations += 1;
    }
  ), true);
  assert.equal(navigations, 1);
});

test('keep flushes successfully and navigates exactly once', async () => {
  const runtime = createRuntime();
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createHabitCollectionLeaveController();
  let navigations = 0;

  await leave.run(async () => {
    assert.equal(await runtime.session.flush(), true);
    runtime.session.markTerminal();
  }, () => {
    navigations += 1;
  });

  assert.equal(runtime.writes.length, 1);
  assert.equal(navigations, 1);
  assert.equal(runtime.session.getState().terminal, true);
});

test('keep storage failure prevents navigation and remains retryable', async () => {
  let shouldFail = true;
  const runtime = createRuntime({
    saveDraft: async () => {
      if (shouldFail) throw new Error('write failed');
      return true;
    },
  });
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createHabitCollectionLeaveController();
  let navigations = 0;

  await assert.rejects(() => leave.run(
    () => runtime.session.flush(),
    () => {
      navigations += 1;
    }
  ));
  assert.equal(navigations, 0);

  shouldFail = false;
  await leave.run(
    () => runtime.session.flush(),
    () => {
      navigations += 1;
    }
  );
  assert.equal(navigations, 1);
});

test('cancel changes neither storage nor navigation', () => {
  let cancelled = 0;
  let discarded = 0;
  let saved = 0;
  const options = createHabitCollectionLeaveOptions({
    onCancel: () => {
      cancelled += 1;
    },
    onDiscard: () => {
      discarded += 1;
    },
    onSave: () => {
      saved += 1;
    },
  });

  options[0].onPress();

  assert.deepEqual({ cancelled, discarded, saved }, {
    cancelled: 1,
    discarded: 0,
    saved: 0,
  });
  assert.deepEqual(options.map(option => option.text), [
    'Abbrechen',
    'Verwerfen',
    'Speichern',
  ]);
});

test('parallel back attempts execute one operation and one navigation', async () => {
  const leave = createHabitCollectionLeaveController();
  let releaseOperation;
  const operation = () => new Promise(resolve => {
    releaseOperation = resolve;
  });
  let navigations = 0;

  const first = leave.run(operation, () => {
    navigations += 1;
  });
  const second = await leave.run(operation, () => {
    navigations += 1;
  });
  releaseOperation();

  assert.equal(second, false);
  assert.equal(await first, true);
  assert.equal(navigations, 1);
});

test('productive orchestration discards and queues the original action once', async () => {
  const runtime = createRuntime();
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const action = { type: 'GO_BACK' };

  assert.equal(
    leave.orchestrator.beginAlert(runtime.session, leave.leaveController),
    true
  );
  assert.equal(await leave.orchestrator.leave(
    runtime.session,
    leave.leaveController,
    () => runtime.session.discard(),
    action
  ), true);

  assert.deepEqual(runtime.removes, ['@draft/user/create']);
  assert.deepEqual(leave.actions, [action]);
  assert.equal(leave.orchestrator.isAlertVisible(), false);
});

test('productive orchestration keeps and queues the original action once', async () => {
  const runtime = createRuntime();
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const action = { type: 'GO_BACK' };

  leave.orchestrator.beginAlert(runtime.session, leave.leaveController);
  assert.equal(await leave.orchestrator.leave(
    runtime.session,
    leave.leaveController,
    async () => {
      assert.equal(await runtime.session.flush(), true);
      runtime.session.markTerminal();
    },
    action
  ), true);

  assert.equal(runtime.writes.length, 1);
  assert.deepEqual(leave.actions, [action]);
});

test('session switch during remove completes old storage without navigation', async () => {
  const oldRuntime = createRuntime();
  const newRuntime = createRuntime({ key: '@draft/next/create' });
  let releaseRemove;
  let removeStartedResolve;
  const removeStarted = new Promise(resolve => {
    removeStartedResolve = resolve;
  });
  const leave = createLeaveOrchestratorRuntime(oldRuntime.session);
  const oldController = leave.leaveController;
  leave.orchestrator.beginAlert(oldRuntime.session, oldController);
  let operationCompleted = false;

  const leaving = leave.orchestrator.leave(
    oldRuntime.session,
    oldController,
    async () => {
      removeStartedResolve();
      await new Promise(resolve => {
        releaseRemove = resolve;
      });
      operationCompleted = true;
    },
    { type: 'GO_BACK' }
  );
  await removeStarted;
  leave.switchSession(newRuntime.session);
  releaseRemove();
  await leaving;

  assert.equal(operationCompleted, true);
  assert.deepEqual(leave.actions, []);
  assert.equal(newRuntime.session.getState().terminal, false);
});

test('session switch during flush cannot navigate or change the new session', async () => {
  const oldRuntime = createRuntime();
  const newRuntime = createRuntime({ key: '@draft/next/edit/id' });
  let releaseFlush;
  let flushStartedResolve;
  const flushStarted = new Promise(resolve => {
    flushStartedResolve = resolve;
  });
  const leave = createLeaveOrchestratorRuntime(oldRuntime.session);
  const oldController = leave.leaveController;
  leave.orchestrator.beginAlert(oldRuntime.session, oldController);

  const leaving = leave.orchestrator.leave(
    oldRuntime.session,
    oldController,
    async () => {
      flushStartedResolve();
      await new Promise(resolve => {
        releaseFlush = resolve;
      });
    },
    { type: 'GO_BACK' }
  );
  await flushStarted;
  leave.switchSession(newRuntime.session);
  releaseFlush();
  await leaving;

  assert.deepEqual(leave.actions, []);
  assert.equal(newRuntime.session.getState().phase, 'idle');
  assert.equal(newRuntime.session.getState().terminal, false);
});

test('old cancel cannot release a new session alert', () => {
  const oldRuntime = createRuntime();
  const newRuntime = createRuntime({ key: '@draft/next/create' });
  const leave = createLeaveOrchestratorRuntime(oldRuntime.session);
  const oldController = leave.leaveController;
  leave.orchestrator.beginAlert(oldRuntime.session, oldController);
  leave.switchSession(newRuntime.session);
  leave.orchestrator.beginAlert(newRuntime.session, leave.leaveController);

  assert.equal(
    leave.orchestrator.cancelAlert(oldRuntime.session, oldController),
    false
  );
  assert.equal(leave.orchestrator.isAlertVisible(), true);
});

test('current cancel releases only the current alert', () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  leave.orchestrator.beginAlert(runtime.session, leave.leaveController);

  assert.equal(
    leave.orchestrator.cancelAlert(runtime.session, leave.leaveController),
    true
  );
  assert.equal(leave.orchestrator.isAlertVisible(), false);
});

test('productive orchestration rejects a second alert while leave is running', async () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const controller = leave.leaveController;
  leave.orchestrator.beginAlert(runtime.session, controller);
  let releaseOperation;
  const leaving = leave.orchestrator.leave(
    runtime.session,
    controller,
    () => new Promise(resolve => {
      releaseOperation = resolve;
    }),
    { type: 'GO_BACK' }
  );
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(leave.orchestrator.beginAlert(runtime.session, controller), false);
  releaseOperation();
  await leaving;
  assert.equal(leave.actions.length, 1);
});

test('productive orchestration keeps current session retryable after storage error', async () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const controller = leave.leaveController;
  leave.orchestrator.beginAlert(runtime.session, controller);

  assert.equal(await leave.orchestrator.leave(
    runtime.session,
    controller,
    async () => {
      throw new Error('storage failed');
    },
    { type: 'GO_BACK' }
  ), false);

  assert.deepEqual(leave.actions, []);
  assert.equal(leave.errors.length, 1);
  assert.equal(leave.orchestrator.isAlertVisible(), false);
  assert.equal(leave.orchestrator.beginAlert(runtime.session, controller), true);
});

for (const mutationKind of ['create', 'edit']) {
  test(`alert ${mutationKind} save dispatches only the intercepted back action`, async () => {
    const runtime = createRuntime({
      key: `@draft/user/${mutationKind}`,
    });
    const restored = await runtime.session.hydrate();
    runtime.session.activate(restored.snapshot);
    runtime.session.update(draft);
    const leave = createLeaveOrchestratorRuntime(runtime.session);
    const controller = leave.leaveController;
    const ticket = leave.orchestrator.beginMutation();
    const backAction = {
      type: 'GO_BACK',
      payload: { source: `${mutationKind}-swipe` },
    };
    let remoteMutations = 0;
    let genericNavigations = 0;
    const submit = async (successAction) => {
      remoteMutations += 1;
      return leave.orchestrator.completeMutation(ticket, {
        action: successAction,
        navigate: () => {
          genericNavigations += 1;
        },
      });
    };

    leave.orchestrator.beginAlert(runtime.session, controller);
    assert.equal(
      await leave.orchestrator.save(
        runtime.session,
        controller,
        () => submit(backAction)
      ),
      true
    );
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(remoteMutations, 1);
    assert.deepEqual(leave.actions, [backAction]);
    assert.equal(genericNavigations, 0);
    assert.equal(leave.callbacks.length, 0);
    assert.equal(runtime.removes.length, 1);
    assert.equal(runtime.session.getState().terminal, true);
  });
}

test('alert save validation failure stays retryable without mutation or navigation', async () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const controller = leave.leaveController;
  let remoteMutations = 0;

  leave.orchestrator.beginAlert(runtime.session, controller);
  assert.equal(await leave.orchestrator.save(
    runtime.session,
    controller,
    async () => {
      remoteMutations += 0;
      return false;
    }
  ), false);

  assert.equal(remoteMutations, 0);
  assert.equal(runtime.session.getState().terminal, false);
  assert.equal(runtime.removes.length, 0);
  assert.deepEqual(leave.actions, []);
  assert.equal(leave.callbacks.length, 0);
  assert.equal(leave.orchestrator.beginAlert(runtime.session, controller), true);
});

test('alert save API failure keeps draft and releases the current leave state', async () => {
  const runtime = createRuntime();
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const controller = leave.leaveController;
  let remoteMutations = 0;
  const submit = async () => {
    remoteMutations += 1;
    return false;
  };

  leave.orchestrator.beginAlert(runtime.session, controller);
  assert.equal(
    await leave.orchestrator.save(runtime.session, controller, submit),
    false
  );

  assert.equal(remoteMutations, 1);
  assert.equal(runtime.session.getState().terminal, false);
  assert.equal(runtime.removes.length, 0);
  assert.equal(leave.callbacks.length, 0);
  assert.equal(leave.orchestrator.beginAlert(runtime.session, controller), true);
});

test('alert save session switch cannot complete or navigate the replacement session', async () => {
  const oldRuntime = createRuntime();
  const newRuntime = createRuntime({ key: '@draft/next/edit/id' });
  const leave = createLeaveOrchestratorRuntime(oldRuntime.session);
  const controller = leave.leaveController;
  const ticket = leave.orchestrator.beginMutation();
  let releaseRemote;
  const submit = async () => {
    await new Promise(resolve => {
      releaseRemote = resolve;
    });
    return leave.orchestrator.completeMutation(ticket, () => {
      throw new Error('old mutation must not navigate');
    });
  };

  leave.orchestrator.beginAlert(oldRuntime.session, controller);
  const saving = leave.orchestrator.save(
    oldRuntime.session,
    controller,
    submit
  );
  leave.switchSession(newRuntime.session);
  releaseRemote();

  assert.equal(await saving, false);
  assert.equal(oldRuntime.session.getState().terminal, false);
  assert.equal(newRuntime.session.getState().terminal, false);
  assert.equal(newRuntime.removes.length, 0);
  assert.equal(leave.callbacks.length, 0);
});

test('parallel alert save and back attempts start one submit only', async () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const controller = leave.leaveController;
  let releaseSubmit;
  let submits = 0;
  const submit = async () => {
    submits += 1;
    await new Promise(resolve => {
      releaseSubmit = resolve;
    });
    return false;
  };

  leave.orchestrator.beginAlert(runtime.session, controller);
  const saving = leave.orchestrator.save(
    runtime.session,
    controller,
    submit
  );

  assert.equal(
    await leave.orchestrator.save(runtime.session, controller, submit),
    false
  );
  assert.equal(
    leave.orchestrator.beginAlert(runtime.session, controller),
    false
  );
  releaseSubmit();
  assert.equal(await saving, false);
  assert.equal(submits, 1);
  assert.equal(leave.actions.length, 0);
  assert.equal(leave.callbacks.length, 0);
});

test('mutation ticket is rejected if remote success belongs to an old session', () => {
  let oldMutationCompletions = 0;
  const oldSession = {
    completeMutation() {
      oldMutationCompletions += 1;
      return true;
    },
  };
  const newSession = {
    completeMutation() {
      throw new Error('new session must not be touched');
    },
  };
  const leave = createLeaveOrchestratorRuntime(oldSession);
  const oldController = leave.leaveController;
  let navigations = 0;
  const ticket = leave.orchestrator.beginMutation();

  leave.switchSession(newSession);
  assert.equal(leave.orchestrator.completeMutation(
    ticket,
    () => {
      navigations += 1;
    }
  ), false);

  assert.equal(ticket.session, oldSession);
  assert.equal(ticket.leaveController, oldController);
  assert.equal(oldMutationCompletions, 0);
  assert.equal(navigations, 0);
  assert.deepEqual(leave.callbacks, []);
});

test('normal bottom save keeps its generic success navigation once', () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  let navigations = 0;
  const ticket = leave.orchestrator.beginMutation();

  assert.equal(leave.orchestrator.completeMutation(
    ticket,
    {
      navigate: () => {
        navigations += 1;
      },
      type: 'bottom-save',
    }
  ), true);

  assert.equal(navigations, 1);
  assert.equal(leave.callbacks.length, 1);
  assert.deepEqual(leave.actions, []);
  assert.equal(runtime.session.getState().terminal, true);
  assert.equal(leave.guardBypassed, true);
  assert.deepEqual(leave.settledNavigations, [{
    dispatched: true,
    type: 'bottom-save',
    releaseGuardBypass: false,
  }]);
});

test('cancelled back alert cannot make the following bottom save show another alert', () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const controller = leave.leaveController;
  let navigations = 0;

  assert.equal(leave.orchestrator.beginAlert(runtime.session, controller), true);
  assert.equal(leave.orchestrator.cancelAlert(runtime.session, controller), true);
  const ticket = leave.orchestrator.beginMutation();
  assert.equal(leave.orchestrator.completeMutation(ticket, {
    type: 'bottom-save',
    navigate: () => {
      navigations += 1;
    },
  }), true);

  assert.equal(navigations, 1);
  assert.equal(leave.orchestrator.isAlertVisible(), false);
  assert.equal(leave.guardBypassed, true);
});

test('back save releases its synchronous action bypass after exactly one dispatch', () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const action = { type: 'GO_BACK' };
  const ticket = leave.orchestrator.beginMutation();

  assert.equal(leave.orchestrator.completeMutation(ticket, {
    type: 'back-save',
    action,
  }), true);

  assert.deepEqual(leave.actions, [action]);
  assert.equal(leave.guardBypassed, false);
});

test('delete owner failure returns false without server delete, cleanup or navigation', async () => {
  const hook = await createCollectionDeleteHookRuntime({ failOwnerCheck: true });
  const runtime = createRuntime({ key: '@draft/owner-a/edit/collection-a' });
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const ticket = leave.orchestrator.beginMutation();

  const removed = await hook.result.remove('collection-a', 1);
  if (removed === true) {
    leave.orchestrator.completeMutation(ticket, {
      type: 'bottom-save',
      navigate: () => {},
    });
  }

  assert.equal(removed, false);
  assert.equal(hook.deleteCalls, 0);
  assert.equal(runtime.session.getState().terminal, false);
  assert.deepEqual(runtime.removes, []);
  assert.deepEqual(leave.callbacks, []);
});

test('successful delete returns true once and dismisses to the existing overview', async () => {
  const hook = await createCollectionDeleteHookRuntime();
  const runtime = createRuntime({ key: '@draft/owner-a/edit/collection-a' });
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const ticket = leave.orchestrator.beginMutation();
  const stack = [
    '/tools/habits',
    '/tools/habits-collections',
    '/tools/habits-collection-detail',
    '/tools/habits-collection-edit',
  ];
  const router = createDismissRouter(stack);

  const removed = await hook.result.remove('collection-a', 1);
  assert.equal(removed, true);
  assert.equal(leave.orchestrator.completeMutation(ticket, {
    type: 'bottom-save',
    navigate: () => dismissHabitCollectionsToOverview(router),
  }), true);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(hook.deleteCalls, 1);
  assert.deepEqual(stack, ['/tools/habits']);
  assert.equal(runtime.removes.length, 1);
  assert.equal(runtime.session.getState().terminal, true);
});

test('delete API failure keeps the draft active and permits a successful retry', async () => {
  const hook = await createCollectionDeleteHookRuntime({
    initialDeleteError: new Error('delete failed'),
  });
  const runtime = createRuntime({ key: '@draft/owner-a/edit/collection-a' });
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createLeaveOrchestratorRuntime(runtime.session);

  await assert.rejects(() => hook.result.remove('collection-a', 1), /delete failed/);
  assert.equal(runtime.session.getState().terminal, false);
  assert.deepEqual(runtime.removes, []);
  assert.deepEqual(leave.callbacks, []);

  hook.setDeleteError(null);
  assert.equal(await hook.result.remove('collection-a', 1), true);
  assert.equal(hook.deleteCalls, 2);
});

test('create bottom save dismisses collections and create to the existing overview', () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const ticket = leave.orchestrator.beginMutation();
  const stack = [
    '/tools/habits',
    '/tools/habits-collections',
    '/tools/habits-collection-create',
  ];
  const router = createDismissRouter(stack);
  let createMutations = 0;

  createMutations += 1;
  assert.equal(leave.orchestrator.completeMutation(ticket, {
    type: 'bottom-save',
    navigate: () => dismissHabitCollectionsToOverview(router),
  }), true);

  assert.equal(createMutations, 1);
  assert.deepEqual(stack, ['/tools/habits']);
  assert.equal(leave.callbacks.length, 1);
});

test('edit bottom save dismisses to matching detail A already below', () => {
  const calls = [];
  const router = {
    dismissTo(href) {
      calls.push(['dismissTo', href]);
    },
    push(href) {
      calls.push(['push', href]);
    },
  };

  dismissHabitCollectionEditToDetail({
    router,
    navigationState: {
      index: 2,
      routes: [
        { name: 'habits' },
        {
          name: 'habits-collection-detail',
          params: { collectionId: 'collection-a' },
        },
        { name: 'habits-collection-edit' },
      ],
    },
    collectionId: 'collection-a',
  });

  assert.deepEqual(calls, [['dismissTo', {
    pathname: '/tools/habits-collection-detail',
    params: { collectionId: 'collection-a' },
  }]]);
});

for (const entry of [
  {
    name: 'no detail below',
    routes: [{ name: 'habits-collection-edit' }],
    index: 0,
  },
  {
    name: 'different detail B below',
    routes: [
      { name: 'habits' },
      {
        name: 'habits-collection-detail',
        params: { collectionId: 'collection-b' },
      },
      { name: 'habits-collection-edit' },
    ],
    index: 2,
  },
]) {
  test(`edit bottom save rebuilds one detail A from ${entry.name}`, () => {
    const calls = [];
    const router = {
      dismissTo(href) {
        calls.push(['dismissTo', href]);
      },
      push(href) {
        calls.push(['push', href]);
      },
    };

    dismissHabitCollectionEditToDetail({
      router,
      navigationState: entry,
      collectionId: 'collection-a',
    });

    assert.deepEqual(calls, [
      ['dismissTo', '/tools/habits'],
      ['push', {
      pathname: '/tools/habits-collection-detail',
      params: { collectionId: 'collection-a' },
      }],
    ]);
  });
}

for (const mutationKind of ['create', 'update', 'delete']) {
  test(`${mutationKind} ticket captured before remote request cannot affect a replacement session`, async () => {
    const oldRuntime = createRuntime({ key: `@draft/user/${mutationKind}` });
    const newRuntime = createRuntime({ key: `@draft/next/${mutationKind}` });
    const leave = createLeaveOrchestratorRuntime(oldRuntime.session);
    const ticket = leave.orchestrator.beginMutation();
    let resolveRemote;
    const remote = new Promise(resolve => {
      resolveRemote = resolve;
    });

    leave.switchSession(newRuntime.session);
    resolveRemote({ ok: true });
    await remote;

    assert.equal(
      leave.orchestrator.completeMutation(ticket, () => {
        throw new Error('old mutation must not navigate');
      }),
      false
    );
    assert.equal(oldRuntime.session.getState().terminal, false);
    assert.equal(newRuntime.session.getState().terminal, false);
    assert.equal(newRuntime.removes.length, 0);
    assert.equal(leave.callbacks.length, 0);
  });
}

test('pending action is discarded if the session changes before dispatch', () => {
  const oldRuntime = createRuntime();
  const newRuntime = createRuntime({ key: '@draft/next/create' });
  const leave = createLeaveOrchestratorRuntime(
    oldRuntime.session,
    { autoDrain: false }
  );
  const oldController = leave.leaveController;
  const action = { type: 'GO_BACK', payload: { source: 'old' } };

  assert.equal(
    leave.navigationController.enqueueAction(
      oldRuntime.session,
      oldController,
      action
    ),
    true
  );
  leave.switchSession(newRuntime.session);

  assert.equal(leave.drainNavigation(), false);
  assert.deepEqual(leave.actions, []);
  assert.equal(leave.guardBypassed, false);
  assert.equal(newRuntime.session.getState().terminal, false);
});

test('current pending action dispatches unchanged and exactly once', () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session, {
    autoDrain: false,
  });
  const action = { type: 'GO_BACK', payload: { source: 'current' } };

  assert.equal(
    leave.navigationController.enqueueAction(
      runtime.session,
      leave.leaveController,
      action
    ),
    true
  );
  assert.equal(leave.drainNavigation(), true);
  assert.equal(leave.drainNavigation(), false);
  assert.deepEqual(leave.actions, [action]);
});

test('pending callback does not dispatch after unmount', () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session, {
    autoDrain: false,
  });
  let navigations = 0;

  assert.equal(
    leave.navigationController.enqueueCallback(
      runtime.session,
      leave.leaveController,
      () => {
        navigations += 1;
      }
    ),
    true
  );
  leave.unmount();

  assert.equal(leave.drainNavigation(), false);
  assert.equal(navigations, 0);
  assert.equal(leave.guardBypassed, false);
});

test('a second pending navigation is rejected and cannot double dispatch', () => {
  const runtime = createRuntime();
  const leave = createLeaveOrchestratorRuntime(runtime.session, {
    autoDrain: false,
  });
  const first = { type: 'GO_BACK' };

  assert.equal(
    leave.navigationController.enqueueAction(
      runtime.session,
      leave.leaveController,
      first
    ),
    true
  );
  assert.equal(
    leave.navigationController.enqueueAction(
      runtime.session,
      leave.leaveController,
      { type: 'POP' }
    ),
    false
  );
  assert.equal(leave.drainNavigation(), true);
  assert.deepEqual(leave.actions, [first]);
});

test('successful mutation navigates immediately and cleanup retries are bounded', async () => {
  let attempts = 0;
  const runtime = createRuntime({
    removeDraft: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('first cleanup failed');
      return true;
    },
  });
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  let navigations = 0;

  assert.equal(runtime.session.completeMutation(() => {
    navigations += 1;
  }), true);
  assert.equal(navigations, 1);
  assert.equal(runtime.session.getState().terminal, true);
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(attempts, 2);
});

test('failed remote mutation starts neither cleanup nor guard bypass', async () => {
  const runtime = createRuntime();
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const leave = createLeaveOrchestratorRuntime(runtime.session);
  const ticket = leave.orchestrator.beginMutation();

  await assert.rejects(
    Promise.reject(new Error('remote mutation failed')),
    /remote mutation failed/
  );

  // The rejected remote mutation never completes its captured ticket.
  assert.equal(ticket.session, runtime.session);
  assert.equal(runtime.session.getState().terminal, false);
  assert.equal(runtime.removes.length, 0);
  assert.equal(leave.callbacks.length, 0);
});

test('an already running write completes before mutation cleanup removes it', async () => {
  let releaseWrite;
  let writeStartedResolve;
  const writeStarted = new Promise(resolve => {
    writeStartedResolve = resolve;
  });
  let storedSnapshot = null;
  const order = [];
  const runtime = createRuntime({
    saveDraft: async (_key, snapshot) => {
      order.push('write-start');
      writeStartedResolve();
      await new Promise(resolve => {
        releaseWrite = resolve;
      });
      storedSnapshot = snapshot;
      order.push('write-finish');
    },
    removeDraft: async () => {
      order.push('remove');
      storedSnapshot = null;
    },
  });
  const restored = await runtime.session.hydrate();
  runtime.session.activate(restored.snapshot);
  runtime.session.update(draft);
  const flush = runtime.session.flush();
  await writeStarted;

  runtime.session.completeMutation(() => {
    order.push('navigate');
  });
  releaseWrite();
  await flush;
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(order, [
    'write-start',
    'navigate',
    'write-finish',
    'remove',
  ]);
  assert.equal(storedSnapshot, null);
  assert.equal(runtime.session.update({ ...draft, name: 'Too late' }), false);
  await runtime.session.close();
  assert.equal(storedSnapshot, null);
});
