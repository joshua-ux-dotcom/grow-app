import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listHabitCollections,
  updateHabitCollection,
  createHabitCollection,
  deleteHabitCollection,
} from '../services/habitCollections';
import { getCurrentUserId } from '../../../../services/authUser';
import { supabase } from '../../../../services/supabaseClient';

function normalizeCollections(collections) {
  if (!Array.isArray(collections)) return [];
  return collections.map(c => ({
    id: c.id,
    user_id: c.user_id,
    name: typeof c.name === 'string' ? c.name : '',
    days: Array.isArray(c.days) ? c.days : [],
    version: Number(c.version) || 1,
    created_at: c.created_at,
    updated_at: c.updated_at,
    members: Array.isArray(c.members) ? c.members : [],
  })).filter(c => c.id);
}

function getOwnerCacheKey(ownerId, suffix) {
  return `collections:${ownerId}:${suffix}`;
}

const ownerCaches = new Map();

function getOwnerCache(key) {
  return ownerCaches.get(key);
}

function setOwnerCache(key, value) {
  ownerCaches.set(key, value);
}

export function useHabitCollections() {
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const mountedRef = useRef(true);
  const ownerRef = useRef(null);
  const collectionsRef = useRef([]);
  const listRequestRef = useRef(0);
  const pendingActionsRef = useRef(new Set());

  const activateOwner = useCallback((nextOwnerId) => {
    const safeOwnerId = nextOwnerId || null;
    const previousOwnerId = ownerRef.current;
    if (previousOwnerId && previousOwnerId !== safeOwnerId) {
      ownerCaches.delete(getOwnerCacheKey(previousOwnerId, 'list'));
    }
    ownerRef.current = safeOwnerId;
    listRequestRef.current += 1;
    pendingActionsRef.current.clear();
    setOwnerUserId(safeOwnerId);
    setLoadError(null);
    setActionError(null);

    if (!safeOwnerId) {
      collectionsRef.current = [];
      setCollections([]);
      setLoading(false);
      return;
    }

    const cacheKey = getOwnerCacheKey(safeOwnerId, 'list');
    const cached = normalizeCollections(getOwnerCache(cacheKey) ?? []);
    collectionsRef.current = cached;
    setCollections(cached);
    setLoading(getOwnerCache(cacheKey) == null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let authSequence = 0;

    const resolveInitialOwner = async () => {
      const sequence = ++authSequence;
      try {
        const userId = await getCurrentUserId();
        if (mountedRef.current && sequence === authSequence) activateOwner(userId);
      } catch (_error) {
        if (mountedRef.current && sequence === authSequence) activateOwner(null);
      }
    };

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authSequence += 1;
        if (mountedRef.current) activateOwner(session?.user?.id ?? null);
      }
    );
    resolveInitialOwner();

    return () => {
      mountedRef.current = false;
      authSequence += 1;
      listRequestRef.current += 1;
      pendingActionsRef.current.clear();
      subscription?.unsubscribe?.();
    };
  }, [activateOwner]);

  const loadCollections = useCallback(async ({ silent = false } = {}) => {
    const requestOwnerId = ownerRef.current;
    if (!requestOwnerId) return;

    const requestId = ++listRequestRef.current;
    if (mountedRef.current && !silent) {
      setLoading(true);
      setLoadError(null);
    }

    try {
      const data = normalizeCollections(await listHabitCollections());
      if (!mountedRef.current || requestId !== listRequestRef.current) return;

      collectionsRef.current = data;
      setCollections(data);
      setOwnerCache(getOwnerCacheKey(requestOwnerId, 'list'), data);
    } catch (_error) {
      if (mountedRef.current && requestId === listRequestRef.current) {
        setLoadError('Sammlungen konnten nicht geladen werden.');
      }
    } finally {
      if (mountedRef.current && !silent && requestId === listRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!ownerUserId) return;
    const cacheKey = getOwnerCacheKey(ownerUserId, 'list');
    const hasCached = getOwnerCache(cacheKey) != null;
    loadCollections({ silent: hasCached });
  }, [ownerUserId, loadCollections]);

  const requireMutationOwner = useCallback(async () => {
    if (!ownerRef.current) throw new Error('Nicht eingeloggt');
    const currentUserId = await getCurrentUserId();
    if (!currentUserId || currentUserId !== ownerRef.current) {
      throw new Error('Nicht eingeloggt');
    }
    return ownerRef.current;
  }, []);

  const add = useCallback(
    async (name, days, members = []) => {
      const safeName = typeof name === 'string' ? name.trim() : '';
      if (!safeName) return null;

      let mutationOwnerId;
      try {
        mutationOwnerId = await requireMutationOwner();
      } catch (_error) {
        if (mountedRef.current) {
          setActionError('Sammlung konnte nicht erstellt werden.');
        }
        return null;
      }

      const actionKey = `add:${safeName}:${days.join(',')}`;
      if (pendingActionsRef.current.has(actionKey)) return null;
      pendingActionsRef.current.add(actionKey);

      try {
        const newCollection = await createHabitCollection({
          name: safeName,
          days,
          members,
        });

        if (!mountedRef.current || ownerRef.current !== mutationOwnerId) return newCollection;

        const nextCollections = [...collectionsRef.current, newCollection];
        collectionsRef.current = nextCollections;
        setCollections(nextCollections);
        setOwnerCache(getOwnerCacheKey(mutationOwnerId, 'list'), nextCollections);
        return newCollection;
      } finally {
        pendingActionsRef.current.delete(actionKey);
      }
    },
    [requireMutationOwner]
  );

  const update = useCallback(
    async (collectionId, name, days, members = [], expectedVersion) => {
      if (!collectionId) return null;

      const safeName = typeof name === 'string' ? name.trim() : '';
      if (!safeName) return null;

      let mutationOwnerId;
      try {
        mutationOwnerId = await requireMutationOwner();
      } catch (_error) {
        if (mountedRef.current) {
          setActionError('Sammlung konnte nicht aktualisiert werden.');
        }
        return null;
      }

      const actionKey = `update:${collectionId}`;
      if (pendingActionsRef.current.has(actionKey)) return null;
      pendingActionsRef.current.add(actionKey);

      const cacheKey = getOwnerCacheKey(mutationOwnerId, 'list');
      const previousCollections = normalizeCollections(
        getOwnerCache(cacheKey) ?? collectionsRef.current
      );

      try {
        const updated = await updateHabitCollection(collectionId, {
          name: safeName,
          days,
          members,
          expected_version: expectedVersion,
        });

        if (!mountedRef.current || ownerRef.current !== mutationOwnerId) return updated;

        const nextCollections = previousCollections.map(c =>
          c.id === collectionId ? updated : c
        );
        collectionsRef.current = nextCollections;
        setCollections(nextCollections);
        setOwnerCache(cacheKey, nextCollections);
        return updated;
      } finally {
        pendingActionsRef.current.delete(actionKey);
      }
    },
    [requireMutationOwner]
  );

  const remove = useCallback(
    async (collectionId, expectedVersion) => {
      if (!collectionId) return false;

      let mutationOwnerId;
      try {
        mutationOwnerId = await requireMutationOwner();
      } catch (_error) {
        if (mountedRef.current) {
          setActionError('Sammlung konnte nicht gelöscht werden.');
        }
        return false;
      }

      const actionKey = `delete:${collectionId}`;
      if (pendingActionsRef.current.has(actionKey)) return false;
      pendingActionsRef.current.add(actionKey);

      const cacheKey = getOwnerCacheKey(mutationOwnerId, 'list');
      const previousCollections = normalizeCollections(
        getOwnerCache(cacheKey) ?? collectionsRef.current
      );
      const nextCollections = previousCollections.filter(c => c.id !== collectionId);

      setOwnerCache(cacheKey, nextCollections);
      if (ownerRef.current === mutationOwnerId) {
        collectionsRef.current = nextCollections;
        setCollections(nextCollections);
      }

      try {
        await deleteHabitCollection(collectionId, expectedVersion);
        return true;
      } catch (_error) {
        setOwnerCache(cacheKey, previousCollections);
        if (mountedRef.current && ownerRef.current === mutationOwnerId) {
          collectionsRef.current = previousCollections;
          setCollections(previousCollections);
          setActionError('Sammlung konnte nicht gelöscht werden.');
        }
        throw _error;
      } finally {
        pendingActionsRef.current.delete(actionKey);
      }
    },
    [requireMutationOwner]
  );

  return {
    ownerUserId,
    collections,
    loading,
    loadError,
    actionError,
    setActionError,
    loadCollections,
    add,
    update,
    remove,
  };
}
