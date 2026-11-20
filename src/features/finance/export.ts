import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import type { Transaction } from '../../types';

export async function exportTransactionsToCSV(transactions: Transaction[], currency = 'INR'): Promise<void> {
  const headers = ['Date', 'Type', 'Category', `Amount (${currency})`, 'Description'];
  const rows = transactions.map((t) => [
    format(new Date(t.date), 'yyyy-MM-dd'),
    t.type.toUpperCase(),
    `"${t.category.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    `"${(t.description ?? '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const fileName = `LifeOS_Transactions_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Financial Transactions',
      UTI: 'public.comma-separated-values-text'
    });
  }
}
