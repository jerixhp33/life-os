import { buildSpendingSummary, formatCurrency } from '../../src/features/finance/logic';
import type { Transaction } from '../../src/types';
const makeTx = (o: Partial<Transaction> = {}): Transaction => ({ id:'t1', user_id:'u1', type:'expense', amount:10, currency:'USD', category:'Food', date:'2024-01-15', is_recurring:false, created_at:'', updated_at:'', ...o });

describe('buildSpendingSummary', () => {
  it('returns zeros for empty array', () => {
    const s = buildSpendingSummary([], 'USD');
    expect(s.total_income).toBe(0);
    expect(s.total_expenses).toBe(0);
    expect(s.net).toBe(0);
  });
  it('sums income and expenses correctly', () => {
    const s = buildSpendingSummary([makeTx({type:'income',amount:5000}), makeTx({amount:200}), makeTx({amount:150,category:'Transport'})], 'USD');
    expect(s.total_income).toBe(5000);
    expect(s.total_expenses).toBe(350);
    expect(s.net).toBe(4650);
  });
  it('groups by category', () => {
    const s = buildSpendingSummary([makeTx({amount:30}), makeTx({amount:20}), makeTx({amount:50,category:'Transport'})], 'USD');
    expect(s.by_category['Food']).toBe(50);
    expect(s.by_category['Transport']).toBe(50);
  });
  it('calculates negative net', () => {
    const s = buildSpendingSummary([makeTx({type:'income',amount:100}), makeTx({amount:200})], 'USD');
    expect(s.net).toBe(-100);
  });
  it('does not include income in by_category', () => {
    const s = buildSpendingSummary([makeTx({type:'income',amount:1000,category:'Salary'})], 'USD');
    expect(s.by_category['Salary']).toBeUndefined();
  });
});

describe('formatCurrency', () => {
  it('formats USD', () => { expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56'); });
  it('handles zero',  () => { expect(formatCurrency(0, 'USD', 'en-US')).toBe('$0.00'); });
  it('falls back gracefully for unknown currency', () => { expect(formatCurrency(100, 'XYZ')).toContain('100'); });
  it('handles large numbers', () => { expect(formatCurrency(1_000_000, 'USD', 'en-US')).toBe('$1,000,000.00'); });
});
