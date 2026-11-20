import { createTask } from '../tasks/api';
import { createTransaction, fetchMonthlyTransactions, buildSpendingSummary, formatCurrency } from '../finance/api';
import { fetchHabits, logHabit } from '../habits/api';

export const AI_TOOLS_DECLARATIONS = [
  {
    name: 'create_transaction',
    description: 'Record a new financial income or expense transaction in Indian Rupees (INR).',
    parameters: {
      type: 'OBJECT',
      properties: {
        amount: { type: 'NUMBER', description: 'Amount in Indian Rupees (INR), e.g. 500, 1200' },
        type: { type: 'STRING', enum: ['expense', 'income'], description: 'Whether this is an expense or income' },
        category: {
          type: 'STRING',
          description: 'Category name such as UPI & Digital Payments, Food & Dining, Groceries & Kirana, Rent & Housing, Shopping & Lifestyle, EMI & Loans, Monthly Salary'
        },
        description: { type: 'STRING', description: 'Optional details, payee, or note about this transaction' }
      },
      required: ['amount', 'type', 'category']
    }
  },
  {
    name: 'create_task',
    description: 'Create a new to-do task with an optional priority and due date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Title or description of what needs to get done' },
        priority: { type: 'STRING', enum: ['low', 'medium', 'high', 'urgent'], description: 'Urgency level' },
        due_date: { type: 'STRING', description: 'Due date in YYYY-MM-DD format if mentioned' }
      },
      required: ['title']
    }
  },
  {
    name: 'get_financial_summary',
    description: 'Retrieve the user current monthly financial summary, total income, total expenses, and net savings.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month_offset: { type: 'NUMBER', description: '0 for current month, 1 for last month' }
      }
    }
  }
];

export async function executeAiToolCall(
  name: string,
  args: Record<string, any>,
  uid: string,
  currency = 'INR'
): Promise<string> {
  try {
    if (name === 'create_transaction') {
      const { amount, type, category, description } = args;
      const numAmount = Number(amount);
      await createTransaction(uid, {
        amount: numAmount,
        type: (type as 'income' | 'expense') || 'expense',
        category: category || 'Other Spends',
        currency: currency || 'INR',
        is_recurring: false,
        description: description || undefined,
        date: new Date().toISOString()
      });
      return `Successfully recorded ${type} of ${formatCurrency(numAmount, currency)} for "${category}"${description ? ` (${description})` : ''}.`;
    }

    if (name === 'create_task') {
      const { title, priority, due_date } = args;
      await createTask(uid, {
        title,
        priority: priority || 'medium',
        due_date: due_date || undefined
      });
      return `Task "${title}" created with ${priority || 'medium'} priority${due_date ? ` due on ${due_date}` : ''}.`;
    }

    if (name === 'get_financial_summary') {
      const offset = Number(args.month_offset ?? 0);
      const txs = await fetchMonthlyTransactions(uid, offset);
      const summary = buildSpendingSummary(txs, currency);
      return `Monthly Summary: Total Income is ${formatCurrency(summary.total_income, currency)}, Total Expenses are ${formatCurrency(summary.total_expenses, currency)}, with Net Savings of ${formatCurrency(summary.net, currency)}.`;
    }

    return `Unrecognized tool: ${name}`;
  } catch (err) {
    return `Failed to execute ${name}: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}
