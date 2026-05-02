import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@deep_work_session';

export async function startDeepWorkSession(seconds) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ startTime: Date.now(), duration: seconds }));
}

export async function clearDeepWorkSession() {
  await AsyncStorage.removeItem(KEY);
}

export async function getDeepWorkTimeLeft() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return 0;
    const { startTime, duration } = JSON.parse(raw);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const left = duration - elapsed;
    if (left <= 0) {
      await AsyncStorage.removeItem(KEY);
      return 0;
    }
    return left;
  } catch {
    return 0;
  }
}