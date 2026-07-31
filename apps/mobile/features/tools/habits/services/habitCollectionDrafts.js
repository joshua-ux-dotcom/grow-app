import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_PREFIX = '@grow/habit-collection-draft/v1';
const DRAFT_VERSION = 1;

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(
    values.filter(value => typeof value === 'string' && value.length > 0)
  ));
}

function normalizeDays(days) {
  if (!Array.isArray(days)) return [];
  return Array.from(new Set(days
    .map(Number)
    .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
  )).sort((a, b) => a - b);
}

export function normalizeHabitCollectionSnapshot(snapshot) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const selectedHabitIds = normalizeStringArray(source.selectedHabitIds);
  const newHabits = Array.isArray(source.newHabits)
    ? source.newHabits
      .filter(item => (
        item
        && typeof item.tempId === 'string'
        && item.tempId.length > 0
        && typeof item.name === 'string'
        && item.name.trim().length > 0
      ))
      .map(item => ({ tempId: item.tempId, name: item.name.trim() }))
    : [];
  const validMemberIds = new Set([
    ...selectedHabitIds,
    ...newHabits.map(item => item.tempId),
  ]);
  const orderedIds = normalizeStringArray(source.memberOrder)
    .filter(id => validMemberIds.has(id));
  const missingIds = Array.from(validMemberIds)
    .filter(id => !orderedIds.includes(id));

  return {
    name: typeof source.name === 'string' ? source.name : '',
    days: normalizeDays(source.days),
    selectedHabitIds,
    newHabits,
    memberOrder: [...orderedIds, ...missingIds],
    newHabitName: typeof source.newHabitName === 'string'
      ? source.newHabitName
      : '',
  };
}

export function createEmptyHabitCollectionSnapshot() {
  return normalizeHabitCollectionSnapshot({});
}

export function createHabitCollectionBaseline(collection) {
  const members = Array.isArray(collection?.members) ? collection.members : [];
  return normalizeHabitCollectionSnapshot({
    name: collection?.name,
    days: collection?.days,
    selectedHabitIds: members.map(member => member?.habit_id),
    memberOrder: members.map(member => member?.habit_id),
  });
}

export function areHabitCollectionSnapshotsEqual(left, right) {
  return JSON.stringify(normalizeHabitCollectionSnapshot(left))
    === JSON.stringify(normalizeHabitCollectionSnapshot(right));
}

export function getHabitCollectionDraftKey(userId, mode, collectionId) {
  if (typeof userId !== 'string' || userId.length === 0) return null;
  if (mode === 'create') return `${DRAFT_PREFIX}/${userId}/create`;
  if (
    mode === 'edit'
    && typeof collectionId === 'string'
    && collectionId.length > 0
  ) {
    return `${DRAFT_PREFIX}/${userId}/edit/${collectionId}`;
  }
  return null;
}

function isValidDraftPayload(payload) {
  return Boolean(
    payload
    && payload.version === DRAFT_VERSION
    && payload.snapshot
    && typeof payload.snapshot === 'object'
    && typeof payload.snapshot.name === 'string'
    && Array.isArray(payload.snapshot.days)
    && Array.isArray(payload.snapshot.selectedHabitIds)
    && Array.isArray(payload.snapshot.newHabits)
    && Array.isArray(payload.snapshot.memberOrder)
    && typeof payload.snapshot.newHabitName === 'string'
  );
}

async function removeBestEffort(key, attempts = 2) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (_error) {
      // Bounded cleanup. Operational read/write errors remain caller-visible.
    }
  }
  return false;
}

export async function loadHabitCollectionDraft(key) {
  if (!key) return { status: 'missing', snapshot: null };
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return { status: 'missing', snapshot: null };

  try {
    const parsed = JSON.parse(raw);
    if (!isValidDraftPayload(parsed)) {
      await removeBestEffort(key);
      return { status: 'invalid', snapshot: null };
    }
    return {
      status: 'valid',
      snapshot: normalizeHabitCollectionSnapshot(parsed.snapshot),
    };
  } catch (_error) {
    await removeBestEffort(key);
    return { status: 'invalid', snapshot: null };
  }
}

export async function saveHabitCollectionDraft(key, snapshot) {
  if (!key) return false;
  await AsyncStorage.setItem(key, JSON.stringify({
    version: DRAFT_VERSION,
    snapshot: normalizeHabitCollectionSnapshot(snapshot),
  }));
  return true;
}

export async function removeHabitCollectionDraft(key) {
  if (!key) return false;
  await AsyncStorage.removeItem(key);
  return true;
}

export function sanitizeHabitCollectionSnapshot(snapshot, eligibleHabitIds) {
  const normalized = normalizeHabitCollectionSnapshot(snapshot);
  if (!(eligibleHabitIds instanceof Set)) return normalized;
  const selectedHabitIds = normalized.selectedHabitIds
    .filter(habitId => eligibleHabitIds.has(habitId));
  const validMemberIds = new Set([
    ...selectedHabitIds,
    ...normalized.newHabits.map(habit => habit.tempId),
  ]);

  return {
    ...normalized,
    selectedHabitIds,
    memberOrder: normalized.memberOrder
      .filter(memberId => validMemberIds.has(memberId)),
  };
}

export function createHabitCollectionDraftSession({
  key,
  baseline,
  loadDraft = loadHabitCollectionDraft,
  saveDraft = saveHabitCollectionDraft,
  removeDraft = removeHabitCollectionDraft,
  schedule = setTimeout,
  cancelSchedule = clearTimeout,
  writeDelayMs = 350,
}) {
  const normalizedBaseline = normalizeHabitCollectionSnapshot(baseline);
  let phase = 'idle';
  let currentSnapshot = normalizedBaseline;
  let writeTimer = null;
  let storageQueue = Promise.resolve();
  let terminal = false;
  let closed = false;

  const cancelPendingWrite = () => {
    if (writeTimer != null) {
      cancelSchedule(writeTimer);
      writeTimer = null;
    }
  };

  const enqueueStorage = (operation) => {
    const result = storageQueue.catch(() => {}).then(operation);
    storageQueue = result.catch(() => {});
    return result;
  };

  const isDirty = () => (
    phase === 'active'
    && !areHabitCollectionSnapshotsEqual(currentSnapshot, normalizedBaseline)
  );

  const flush = async () => {
    cancelPendingWrite();
    if (terminal || closed || phase !== 'active') return false;
    const snapshotToWrite = normalizeHabitCollectionSnapshot(currentSnapshot);
    const dirty = !areHabitCollectionSnapshotsEqual(
      snapshotToWrite,
      normalizedBaseline
    );
    return enqueueStorage(async () => {
      if (terminal || closed) return false;
      if (dirty) {
        await saveDraft(key, snapshotToWrite);
      } else {
        await removeDraft(key);
      }
      return true;
    });
  };

  const scheduleWrite = () => {
    cancelPendingWrite();
    if (terminal || closed || phase !== 'active') return;
    writeTimer = schedule(() => {
      writeTimer = null;
      void flush().catch(() => {});
    }, writeDelayMs);
  };

  const runCleanup = (maxAttempts) => enqueueStorage(async () => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        await removeDraft(key);
        return true;
      } catch (_error) {
        // Successful remote mutations are never repeated for local cleanup.
      }
    }
    return false;
  });

  return {
    async hydrate(maxAttempts = 2) {
      if (terminal || closed) return { status: 'terminal', snapshot: null };
      phase = 'hydrating';
      let lastError = null;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const result = await loadDraft(key);
          if (terminal || closed) return { status: 'terminal', snapshot: null };
          currentSnapshot = result.status === 'valid'
            ? normalizeHabitCollectionSnapshot(result.snapshot)
            : normalizedBaseline;
          phase = 'awaiting-activation';
          return { status: 'ready', snapshot: currentSnapshot };
        } catch (error) {
          lastError = error;
        }
      }
      if (!terminal && !closed) phase = 'error';
      return { status: 'error', error: lastError, snapshot: null };
    },
    activate(snapshot) {
      if (terminal || closed || phase !== 'awaiting-activation') return false;
      currentSnapshot = normalizeHabitCollectionSnapshot(snapshot);
      phase = 'active';
      return true;
    },
    update(snapshot) {
      if (terminal || closed || phase !== 'active') return false;
      currentSnapshot = normalizeHabitCollectionSnapshot(snapshot);
      scheduleWrite();
      return true;
    },
    replaceSnapshot(snapshot) {
      if (terminal || closed) return false;
      currentSnapshot = normalizeHabitCollectionSnapshot(snapshot);
      return true;
    },
    flush,
    async discard() {
      cancelPendingWrite();
      if (terminal || closed) return false;
      const previousPhase = phase;
      terminal = true;
      phase = 'terminal';
      try {
        await enqueueStorage(() => removeDraft(key));
        return true;
      } catch (error) {
        terminal = false;
        phase = previousPhase;
        if (phase === 'active') scheduleWrite();
        throw error;
      }
    },
    markTerminal() {
      cancelPendingWrite();
      terminal = true;
      phase = 'terminal';
    },
    completeMutation(navigate, maxCleanupAttempts = 2) {
      if (terminal || closed) return false;
      cancelPendingWrite();
      terminal = true;
      phase = 'terminal';
      void runCleanup(maxCleanupAttempts);
      navigate();
      return true;
    },
    async close() {
      cancelPendingWrite();
      if (closed) return false;
      if (terminal || phase !== 'active') {
        closed = true;
        return false;
      }
      const snapshotToWrite = normalizeHabitCollectionSnapshot(currentSnapshot);
      const dirty = !areHabitCollectionSnapshotsEqual(
        snapshotToWrite,
        normalizedBaseline
      );
      closed = true;
      return enqueueStorage(async () => {
        try {
          if (dirty) {
            await saveDraft(key, snapshotToWrite);
          } else {
            await removeDraft(key);
          }
          return true;
        } catch (_error) {
          return false;
        }
      });
    },
    getState() {
      return {
        key,
        phase,
        terminal,
        closed,
        dirty: isDirty(),
        snapshot: currentSnapshot,
      };
    },
  };
}

export function createHabitCollectionLeaveController() {
  let inProgress = false;
  let completed = false;

  return {
    async run(operation, navigate) {
      if (inProgress || completed) return false;
      inProgress = true;
      try {
        await operation();
        completed = true;
        navigate();
        return true;
      } catch (error) {
        inProgress = false;
        throw error;
      }
    },
    isInProgress() {
      return inProgress;
    },
  };
}

export function createHabitCollectionNavigationController({
  getCurrentSession,
  getCurrentLeaveController,
  onPending,
  onSettled = () => {},
}) {
  let pending = null;

  const isCurrent = entry => (
    getCurrentSession() === entry.session
    && getCurrentLeaveController() === entry.leaveController
  );
  const enqueue = (entry) => {
    if (pending || !isCurrent(entry)) return false;
    pending = entry;
    onPending(entry.type);
    return true;
  };

  return {
    enqueueAction(session, leaveController, action, type = 'back-save') {
      return enqueue({
        kind: 'action',
        type,
        session,
        leaveController,
        action,
      });
    },
    enqueueCallback(session, leaveController, navigate, type = 'bottom-save') {
      return enqueue({
        kind: 'callback',
        type,
        session,
        leaveController,
        navigate,
      });
    },
    drain(dispatch) {
      const entry = pending;
      pending = null;
      if (!entry || !isCurrent(entry)) {
        onSettled({
          dispatched: false,
          type: entry?.type ?? null,
          releaseGuardBypass: true,
        });
        return false;
      }
      if (entry.kind === 'action') {
        dispatch(entry.action);
      } else {
        entry.navigate();
      }
      onSettled({
        dispatched: true,
        type: entry.type,
        releaseGuardBypass: entry.type !== 'bottom-save',
      });
      return true;
    },
    clear() {
      pending = null;
    },
    hasPending() {
      return pending != null;
    },
  };
}

export function createHabitCollectionLeaveOrchestrator({
  getCurrentSession,
  getCurrentLeaveController,
  queueNavigationAction,
  queueNavigationCallback,
  onStorageError,
}) {
  let alertOwner = null;

  const isCurrent = (session, leaveController) => (
    getCurrentSession() === session
    && getCurrentLeaveController() === leaveController
  );
  const ownsAlert = (session, leaveController) => (
    alertOwner?.session === session
    && alertOwner?.leaveController === leaveController
  );

  return {
    resetForCurrentSession() {
      alertOwner = null;
    },
    beginAlert(session, leaveController) {
      if (
        !isCurrent(session, leaveController)
        || alertOwner
        || leaveController.isInProgress()
      ) {
        return false;
      }
      alertOwner = { session, leaveController };
      return true;
    },
    cancelAlert(session, leaveController) {
      if (
        !isCurrent(session, leaveController)
        || !ownsAlert(session, leaveController)
      ) {
        return false;
      }
      alertOwner = null;
      return true;
    },
    async leave(session, leaveController, operation, action) {
      if (
        !isCurrent(session, leaveController)
        || !ownsAlert(session, leaveController)
      ) {
        return false;
      }
      try {
        return await leaveController.run(operation, () => {
          if (!isCurrent(session, leaveController)) return;
          alertOwner = null;
          queueNavigationAction(session, leaveController, action, 'back-save');
        });
      } catch (error) {
        if (isCurrent(session, leaveController)) {
          alertOwner = null;
          onStorageError(error);
        }
        return false;
      }
    },
    async save(session, leaveController, operation) {
      if (
        !isCurrent(session, leaveController)
        || !ownsAlert(session, leaveController)
      ) {
        return false;
      }
      try {
        return await leaveController.run(async () => {
          const saved = await operation();
          if (!saved) throw new Error('Collection save did not complete.');
        }, () => {
          if (!isCurrent(session, leaveController)) return;
          alertOwner = null;
        });
      } catch (_error) {
        if (isCurrent(session, leaveController)) {
          alertOwner = null;
        }
        return false;
      }
    },
    beginMutation() {
      const session = getCurrentSession();
      const leaveController = getCurrentLeaveController();
      if (!session || !leaveController) return null;
      return Object.freeze({ session, leaveController });
    },
    completeMutation(ticket, navigationTarget) {
      if (
        !ticket
        || !isCurrent(ticket.session, ticket.leaveController)
      ) {
        return false;
      }
      const target = typeof navigationTarget === 'function'
        ? { navigate: navigationTarget }
        : navigationTarget;
      const targetType = target?.type
        ?? (target?.action ? 'back-save' : target?.navigate ? 'bottom-save' : null);
      return ticket.session.completeMutation(() => {
        if (!isCurrent(ticket.session, ticket.leaveController)) return;
        if (targetType === 'back-save' && target.action) {
          queueNavigationAction(
            ticket.session,
            ticket.leaveController,
            target.action,
            'back-save'
          );
        } else if (targetType === 'bottom-save' && target.navigate) {
          queueNavigationCallback(
            ticket.session,
            ticket.leaveController,
            target.navigate,
            'bottom-save'
          );
        }
      });
    },
    isAlertVisible() {
      return alertOwner != null;
    },
  };
}

export function createHabitCollectionLeaveOptions({
  onCancel,
  onDiscard,
  onSave,
}) {
  return [
    { text: 'Abbrechen', style: 'cancel', onPress: onCancel },
    { text: 'Verwerfen', style: 'destructive', onPress: onDiscard },
    { text: 'Speichern', onPress: onSave },
  ];
}

export function dismissHabitCollectionEditToDetail({
  router,
  navigationState,
  collectionId,
}) {
  const detailHref = {
    pathname: '/tools/habits-collection-detail',
    params: { collectionId },
  };
  const routes = Array.isArray(navigationState?.routes)
    ? navigationState.routes
    : [];
  const currentIndex = Number.isInteger(navigationState?.index)
    ? navigationState.index
    : routes.length - 1;
  const previousRoute = routes[currentIndex - 1];
  const hasMatchingDetailBelow = (
    previousRoute?.name === 'habits-collection-detail'
    && previousRoute?.params?.collectionId === collectionId
  );

  if (hasMatchingDetailBelow) {
    router.dismissTo(detailHref);
    return;
  }

  router.dismissTo('/tools/habits');
  router.push(detailHref);
}

export function dismissHabitCollectionsToOverview(router) {
  router.dismissTo('/tools/habits');
}
