import { supabase } from '../../lib/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { Transaction, Budget, SavingsGoal, SpendingSummary } from '../../types';
import type { TransactionFormValues, BudgetFormValues, SavingsGoalFormValues } from '../../lib/validation/schemas';
export async function fetchMonthlyTransactions(uid:string,offset=0):Promise<Transaction[]> {
  const base=subMonths(new Date(),offset);
  const { data,error }=await supabase.from('transactions').select('*').eq('user_id',uid).gte('date',format(startOfMonth(base),'yyyy-MM-dd')).lte('date',format(endOfMonth(base),'yyyy-MM-dd')).order('date',{ascending:false}).limit(100);
  if(error)throw new Error(error.message); return data as Transaction[];
}
export async function createTransaction(uid:string,values:TransactionFormValues):Promise<Transaction> { const { data,error }=await supabase.from('transactions').insert({ user_id:uid,...values }).select().single(); if(error)throw new Error(error.message); return data as Transaction; }
export async function updateTransaction(id:string,updates:Partial<TransactionFormValues>):Promise<Transaction> { const { data,error }=await supabase.from('transactions').update({ ...updates, updated_at:new Date().toISOString() }).eq('id',id).select().single(); if(error)throw new Error(error.message); return data as Transaction; }
export async function deleteTransaction(id:string):Promise<void> { const { error }=await supabase.from('transactions').delete().eq('id',id); if(error)throw new Error(error.message); }
export async function fetchBudgets(uid:string):Promise<Budget[]> { const { data,error }=await supabase.from('budgets').select('*').eq('user_id',uid); if(error)throw new Error(error.message); return data as Budget[]; }
export async function upsertBudget(uid:string,values:BudgetFormValues):Promise<Budget> { const { data,error }=await supabase.from('budgets').upsert({ user_id:uid,...values },{ onConflict:'user_id,category,period' }).select().single(); if(error)throw new Error(error.message); return data as Budget; }
export async function deleteBudget(id:string):Promise<void> { const { error }=await supabase.from('budgets').delete().eq('id',id); if(error)throw new Error(error.message); }
export async function fetchSavingsGoals(uid:string):Promise<SavingsGoal[]> { const { data,error }=await supabase.from('savings_goals').select('*').eq('user_id',uid).order('created_at',{ascending:false}); if(error)throw new Error(error.message); return data as SavingsGoal[]; }
export async function createSavingsGoal(uid:string,values:SavingsGoalFormValues):Promise<SavingsGoal> { const { data,error }=await supabase.from('savings_goals').insert({ user_id:uid,...values }).select().single(); if(error)throw new Error(error.message); return data as SavingsGoal; }
export async function deleteSavingsGoal(id:string):Promise<void> { const { error }=await supabase.from('savings_goals').delete().eq('id',id); if(error)throw new Error(error.message); }
export function buildSpendingSummary(txs:Transaction[],currency:string):SpendingSummary {
  const s:SpendingSummary={ total_income:0, total_expenses:0, net:0, by_category:{}, currency };
  for(const tx of txs){ if(tx.type==='income'){ s.total_income+=tx.amount; } else { s.total_expenses+=tx.amount; s.by_category[tx.category]=(s.by_category[tx.category]??0)+tx.amount; } }
  s.net=s.total_income-s.total_expenses; return s;
}
export function formatCurrency(amount:number,currency='INR',locale='en-IN'):string {
  try { return new Intl.NumberFormat(locale,{ style:'currency', currency, minimumFractionDigits:2, maximumFractionDigits:2 }).format(amount); }
  catch { return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
}
