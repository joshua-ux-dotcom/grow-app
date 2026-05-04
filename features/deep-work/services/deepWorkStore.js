import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@deep_work_session';

export async function saveDeepWorkSession(session) {
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}

export async function clearDeepWorkSession() {
  await AsyncStorage.removeItem(KEY);
}

export async function getSavedDeepWorkSession() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);

    if (session.phase === 'running') {
      const elapsed = Math.floor((Date.now() - session.updatedAt) / 1000);
      const left = Math.max((session.remaining || 0) - elapsed, 0);

      if (left <= 0) {
        await clearDeepWorkSession();
        return null;
      }

      return {
        ...session,
        remaining: left,
      };
    }

    return session;
  } catch {
    return null;
  }
}

export async function getDeepWorkTimeLeft() {
  try {
    const session = await getSavedDeepWorkSession();
    return session?.remaining || 0;
  } catch {
    return 0;
  }
}