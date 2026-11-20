import type { Transaction, SpendingSummary } from '../../types';

export function buildSpendingSummary(txs: Transaction[], currency: string): SpendingSummary {
  const s: SpendingSummary = { total_income: 0, total_expenses: 0, net: 0, by_category: {}, currency };
  for (const tx of txs) {
    if (tx.type === 'income') {
      s.total_income += tx.amount;
    } else {
      s.total_expenses += tx.amount;
      s.by_category[tx.category] = (s.by_category[tx.category] ?? 0) + tx.amount;
    }
  }
  s.net = s.total_income - s.total_expenses;
  return s;
}

export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
