import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { supabase } from '../supabase/client';

export interface LifeOsBackupPayload {
  version: '1.0';
  exportedAt: string;
  userId: string;
  data: {
    tasks: any[];
    notes: any[];
    habits: any[];
    habitLogs: any[];
    transactions: any[];
    documents: any[];
  };
}

export interface RestoreSummary {
  tasksCount: number;
  notesCount: number;
  habitsCount: number;
  habitLogsCount: number;
  transactionsCount: number;
}

export async function exportFullLifeOsBackup(uid: string): Promise<void> {
  const [tasksRes, notesRes, habitsRes, logsRes, txsRes, docsRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', uid),
    supabase.from('notes').select('*').eq('user_id', uid),
    supabase.from('habits').select('*').eq('user_id', uid),
    supabase.from('habit_logs').select('*').eq('user_id', uid),
    supabase.from('transactions').select('*').eq('user_id', uid),
    supabase.from('documents').select('*').eq('user_id', uid)
  ]);

  const payload: LifeOsBackupPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    userId: uid,
    data: {
      tasks: tasksRes.data ?? [],
      notes: notesRes.data ?? [],
      habits: habitsRes.data ?? [],
      habitLogs: logsRes.data ?? [],
      transactions: txsRes.data ?? [],
      documents: docsRes.data ?? []
    }
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const fileName = `LifeOS_FullBackup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, jsonString, {
    encoding: FileSystem.EncodingType.UTF8
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Complete LifeOS Backup',
      UTI: 'public.json'
    });
  }
}

export async function restoreFullLifeOsBackup(uid: string): Promise<RestoreSummary | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const fileUri = result.assets[0].uri;
  const fileContent = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8
  });

  let parsed: any;
  try {
    parsed = JSON.parse(fileContent);
  } catch (err) {
    throw new Error('Invalid JSON format in the selected backup file.');
  }

  if (!parsed || parsed.version !== '1.0' || !parsed.data) {
    throw new Error('Unsupported backup version or corrupted backup file structure.');
  }

  const { tasks = [], notes = [], habits = [], habitLogs = [], transactions = [] } = parsed.data;

  // Process tasks
  if (tasks.length > 0) {
    const sanitizedTasks = tasks.map((t: any) => ({ ...t, user_id: uid }));
    const { error } = await supabase.from('tasks').upsert(sanitizedTasks, { onConflict: 'id' });
    if (error) throw new Error(`Tasks restore failed: ${error.message}`);
  }

  // Process notes
  if (notes.length > 0) {
    const sanitizedNotes = notes.map((n: any) => ({ ...n, user_id: uid }));
    const { error } = await supabase.from('notes').upsert(sanitizedNotes, { onConflict: 'id' });
    if (error) throw new Error(`Notes restore failed: ${error.message}`);
  }

  // Process habits
  if (habits.length > 0) {
    const sanitizedHabits = habits.map((h: any) => ({ ...h, user_id: uid }));
    const { error } = await supabase.from('habits').upsert(sanitizedHabits, { onConflict: 'id' });
    if (error) throw new Error(`Habits restore failed: ${error.message}`);
  }

  // Process habit logs
  if (habitLogs.length > 0) {
    const sanitizedLogs = habitLogs.map((l: any) => ({ ...l, user_id: uid }));
    const { error } = await supabase.from('habit_logs').upsert(sanitizedLogs, { onConflict: 'id' });
    if (error) throw new Error(`Habit logs restore failed: ${error.message}`);
  }

  // Process transactions
  if (transactions.length > 0) {
    const sanitizedTxs = transactions.map((tx: any) => ({ ...tx, user_id: uid }));
    const { error } = await supabase.from('transactions').upsert(sanitizedTxs, { onConflict: 'id' });
    if (error) throw new Error(`Transactions restore failed: ${error.message}`);
  }

  return {
    tasksCount: tasks.length,
    notesCount: notes.length,
    habitsCount: habits.length,
    habitLogsCount: habitLogs.length,
    transactionsCount: transactions.length
  };
}
