import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/client';
import type { OfflineQueueItem, QueueOperationType } from '../../types';

const QUEUE_STORAGE_KEY = 'lifeos_offline_mutation_queue_v1';
let isProcessing = false;

export async function getPendingQueue(): Promise<OfflineQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: OfflineQueueItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[Offline Queue] Failed to persist queue:', err);
  }
}

export async function enqueueOperation(
  operation: QueueOperationType,
  table: string,
  record_id: string,
  payload: Record<string, unknown>
): Promise<OfflineQueueItem> {
  const queue = await getPendingQueue();
  const item: OfflineQueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    operation,
    table,
    record_id,
    payload,
    created_at: Date.now(),
    retry_count: 0
  };

  queue.push(item);
  await saveQueue(queue);
  console.log(`[Offline Queue] Enqueued ${operation} for ${table}:${record_id}`);

  // Attempt immediate processing if network is available
  processQueue().catch(() => {});

  return item;
}

export async function processQueue(): Promise<{ processed: number; remaining: number }> {
  if (isProcessing) return { processed: 0, remaining: 0 };
  isProcessing = true;

  try {
    const queue = await getPendingQueue();
    if (queue.length === 0) {
      isProcessing = false;
      return { processed: 0, remaining: 0 };
    }

    const remaining: OfflineQueueItem[] = [];
    let processed = 0;

    for (const item of queue) {
      try {
        let err: any = null;

        if (item.operation === 'create') {
          const { error } = await supabase.from(item.table).insert(item.payload);
          err = error;
        } else if (item.operation === 'update') {
          const { error } = await supabase.from(item.table).update(item.payload).eq('id', item.record_id);
          err = error;
        } else if (item.operation === 'delete') {
          const { error } = await supabase.from(item.table).delete().eq('id', item.record_id);
          err = error;
        }

        if (err) {
          // If network failure or temporary error, retain in queue
          item.retry_count += 1;
          item.last_error = err.message;
          if (item.retry_count <= 5) {
            remaining.push(item);
          } else {
            console.error(`[Offline Queue] Dropping item after 5 failed attempts: ${item.id}`, err);
          }
        } else {
          processed += 1;
        }
      } catch (e: any) {
        item.retry_count += 1;
        item.last_error = e?.message ?? 'Network error';
        if (item.retry_count <= 5) {
          remaining.push(item);
        }
      }
    }

    await saveQueue(remaining);
    return { processed, remaining: remaining.length };
  } finally {
    isProcessing = false;
  }
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
}
