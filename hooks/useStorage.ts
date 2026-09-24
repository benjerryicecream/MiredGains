import AsyncStorage from '@react-native-async-storage/async-storage';

export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently ignore write failures — UI still works in memory
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────
export const KEYS = {
  EXERCISES:          'mg:exercises',
  WORKOUTS:           'mg:workouts',
  BODYWEIGHTS:        'mg:bodyweights',
  SCHEDULED_WORKOUTS: 'mg:scheduled_workouts',
  WORKOUT_TEMPLATES:  'mg:workout_templates',
  UNIT:               'mg:unit',
} as const;
