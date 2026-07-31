import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';

import {
  areHabitCollectionSnapshotsEqual,
  createHabitCollectionDraftSession,
  createHabitCollectionLeaveController,
  createHabitCollectionLeaveOrchestrator,
  createHabitCollectionLeaveOptions,
  createHabitCollectionNavigationController,
  getHabitCollectionDraftKey,
  normalizeHabitCollectionSnapshot,
  sanitizeHabitCollectionSnapshot,
} from '../services/habitCollectionDrafts';

export function useHabitCollectionDraft({
  userId,
  mode,
  collectionId,
  baseline,
  snapshot,
  applySnapshot,
  eligibleHabitIds,
  hydrationReady = true,
  onSave,
}) {
  const navigation = useNavigation();
  const key = useMemo(
    () => getHabitCollectionDraftKey(userId, mode, collectionId),
    [userId, mode, collectionId]
  );
  const [hydratedKey, setHydratedKey] = useState(null);
  const [activatedKey, setActivatedKey] = useState(null);
  const [hydratedBaseline, setHydratedBaseline] = useState(null);
  const [hydrationStatus, setHydrationStatus] = useState('idle');
  const [guardBypassed, setGuardBypassed] = useState(false);
  const sessionRef = useRef(null);
  const closePromiseRef = useRef(Promise.resolve());
  const eligibleHabitIdsRef = useRef(eligibleHabitIds);
  const expectedHydrationSignatureRef = useRef(null);
  const retryHydrationRef = useRef(null);
  const onSaveRef = useRef(onSave);
  const leaveControllerRef = useRef(createHabitCollectionLeaveController());
  const navigationControllerRef = useRef(null);
  const leaveOrchestratorRef = useRef(null);

  eligibleHabitIdsRef.current = eligibleHabitIds;
  onSaveRef.current = onSave;
  const sanitizedRenderSnapshot = sanitizeHabitCollectionSnapshot(
    snapshot,
    eligibleHabitIds
  );
  if (sessionRef.current?.getState().key === key) {
    sessionRef.current.replaceSnapshot(sanitizedRenderSnapshot);
  }
  const eligibleHabitIdsSignature = eligibleHabitIds instanceof Set
    ? Array.from(eligibleHabitIds).sort().join('|')
    : '';

  useEffect(() => {
    if (!key || !baseline || !hydrationReady) {
      setHydratedKey(null);
      setActivatedKey(null);
      setHydratedBaseline(null);
      setHydrationStatus('idle');
      return undefined;
    }

    let active = true;
    const normalizedBaseline = normalizeHabitCollectionSnapshot(baseline);
    navigationControllerRef.current?.clear();
    setGuardBypassed(false);
    setHydratedKey(null);
    setActivatedKey(null);
    setHydratedBaseline(null);
    setHydrationStatus('loading');

    const initialize = async () => {
      await closePromiseRef.current;
      if (!active) return;
      const session = createHabitCollectionDraftSession({
        key,
        baseline: normalizedBaseline,
      });
      sessionRef.current = session;
      leaveControllerRef.current = createHabitCollectionLeaveController();
      leaveOrchestratorRef.current?.resetForCurrentSession();
      expectedHydrationSignatureRef.current = null;

      const hydrate = async () => {
        if (!active || sessionRef.current !== session) return;
        setHydrationStatus('loading');
        const result = await session.hydrate();
        if (!active || sessionRef.current !== session) return;
        if (result.status === 'error') {
          setHydrationStatus('error');
          return;
        }
        if (result.status !== 'ready') return;
        const restored = sanitizeHabitCollectionSnapshot(
          result.snapshot,
          eligibleHabitIdsRef.current
        );
        session.replaceSnapshot(restored);
        expectedHydrationSignatureRef.current = JSON.stringify(restored);
        applySnapshot(restored);
        setHydratedBaseline(normalizedBaseline);
        setHydratedKey(key);
        setHydrationStatus('ready');
      };

      retryHydrationRef.current = () => {
        void hydrate();
      };
      await hydrate();
    };

    void initialize();

    return () => {
      active = false;
      retryHydrationRef.current = null;
      navigationControllerRef.current?.clear();
      const session = sessionRef.current;
      if (!session || session.getState().key !== key) return;
      closePromiseRef.current = session.close();
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [key, baseline, hydrationReady, applySnapshot]);

  const isHydrated = Boolean(
    key
    && hydratedKey === key
    && activatedKey === key
    && hydratedBaseline
  );
  const isDirty = Boolean(
    hydratedBaseline
    && hydratedKey === key
    && !areHabitCollectionSnapshotsEqual(
      sanitizedRenderSnapshot,
      hydratedBaseline
    )
  );

  useEffect(() => {
    const session = sessionRef.current;
    if (!session || hydratedKey !== key || !hydratedBaseline) return;
    const sanitized = sanitizeHabitCollectionSnapshot(
      sanitizedRenderSnapshot,
      eligibleHabitIdsRef.current
    );
    if (!areHabitCollectionSnapshotsEqual(sanitized, sanitizedRenderSnapshot)) {
      session.replaceSnapshot(sanitized);
      applySnapshot(sanitized);
      return;
    }

    const signature = JSON.stringify(sanitized);
    if (expectedHydrationSignatureRef.current) {
      if (signature !== expectedHydrationSignatureRef.current) return;
      expectedHydrationSignatureRef.current = null;
      session.activate(sanitized);
      setActivatedKey(key);
      return;
    }
    session.update(sanitized);
  }, [
    snapshot,
    key,
    hydratedKey,
    hydratedBaseline,
    eligibleHabitIdsSignature,
    applySnapshot,
  ]);

  if (!navigationControllerRef.current) {
    navigationControllerRef.current = createHabitCollectionNavigationController({
      getCurrentSession: () => sessionRef.current,
      getCurrentLeaveController: () => leaveControllerRef.current,
      onPending: () => setGuardBypassed(true),
      onSettled: ({ releaseGuardBypass }) => {
        if (releaseGuardBypass) {
          setGuardBypassed(false);
        }
      },
    });
  }

  if (!leaveOrchestratorRef.current) {
    leaveOrchestratorRef.current = createHabitCollectionLeaveOrchestrator({
      getCurrentSession: () => sessionRef.current,
      getCurrentLeaveController: () => leaveControllerRef.current,
      queueNavigationAction: (session, leaveController, action, type) => (
        navigationControllerRef.current.enqueueAction(
          session,
          leaveController,
          action,
          type
        )
      ),
      queueNavigationCallback: (session, leaveController, navigate, type) => (
        navigationControllerRef.current.enqueueCallback(
          session,
          leaveController,
          navigate,
          type
        )
      ),
      onStorageError: () => {
        Alert.alert(
          'Entwurf konnte nicht gesichert werden',
          'Bitte versuche es erneut.'
        );
      },
    });
  }

  useEffect(() => {
    if (!guardBypassed) return;
    navigationControllerRef.current.drain(action => {
      navigation.dispatch(action);
    });
  }, [guardBypassed, navigation]);

  usePreventRemove(
    isDirty && !guardBypassed,
    ({ data }) => {
      const guardedSession = sessionRef.current;
      const guardedLeaveController = leaveControllerRef.current;
      const leaveOrchestrator = leaveOrchestratorRef.current;
      const guardedSave = onSaveRef.current;
      if (
        !guardedSession
        || !leaveOrchestrator.beginAlert(
          guardedSession,
          guardedLeaveController
        )
      ) {
        return;
      }
      Alert.alert(
        'Ungespeicherte Änderungen',
        'Möchtest du die Änderungen verwerfen oder speichern?',
        createHabitCollectionLeaveOptions({
          onCancel: () => {
            leaveOrchestrator.cancelAlert(
              guardedSession,
              guardedLeaveController
            );
          },
          onDiscard: () => {
            void leaveOrchestrator.leave(
              guardedSession,
              guardedLeaveController,
              () => guardedSession.discard(),
              data.action
            );
          },
          onSave: () => {
            if (!guardedSave) return;
            void leaveOrchestrator.save(
              guardedSession,
              guardedLeaveController,
              () => guardedSave(data.action)
            );
          },
        })
      );
    }
  );

  const beginMutation = useCallback(() => (
    leaveOrchestratorRef.current.beginMutation()
  ), []);

  const completeMutation = useCallback((ticket, navigationTarget) => {
    if (navigationControllerRef.current.hasPending()) return false;
    return leaveOrchestratorRef.current.completeMutation(
      ticket,
      navigationTarget
    );
  }, []);

  const retryHydration = useCallback(() => {
    retryHydrationRef.current?.();
  }, []);

  return {
    isHydrated,
    isHydrating: hydrationStatus === 'loading',
    hydrationFailed: hydrationStatus === 'error',
    retryHydration,
    isDirty,
    beginMutation,
    completeMutation,
  };
}
