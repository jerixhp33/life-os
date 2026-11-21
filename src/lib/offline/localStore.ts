import AsyncStorage from '@react-native-async-storage/async-storage';

export async function withTimeout<T>(promiseLike: PromiseLike<T> | Promise<T>, ms = 3500): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

export async function getLocalData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`lifeos_data_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setLocalData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(`lifeos_data_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn(`[LocalStore] Failed to write ${key}:`, err);
  }
}
