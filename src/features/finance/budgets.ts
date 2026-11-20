import AsyncStorage from '@react-native-async-storage/async-storage';

const BUDGETS_STORAGE_KEY = 'lifeos_category_budgets';

export const DEFAULT_INDIAN_BUDGETS: Record<string, number> = {
  'Food & Dining': 10000,
  'Groceries & Kirana': 12000,
  'Rent & Housing': 25000,
  'Electricity & Utilities': 4000,
  'Mobile & Recharge': 1500,
  'Fuel & Auto/Metro': 5000,
  'Shopping & Lifestyle': 8000,
  'EMI & Loans': 20000,
  'SIP & Mutual Funds': 10000
};

export async function getCategoryBudgets(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(BUDGETS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_INDIAN_BUDGETS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_INDIAN_BUDGETS;
}

export async function saveCategoryBudget(category: string, amount: number): Promise<void> {
  const current = await getCategoryBudgets();
  current[category] = amount;
  await AsyncStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(current));
}

export interface BudgetStatus {
  category: string;
  spent: number;
  budget: number;
  percent: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export function evaluateBudgets(
  expensesByCategory: Record<string, number>,
  budgets: Record<string, number>
): BudgetStatus[] {
  const alerts: BudgetStatus[] = [];

  for (const [cat, spent] of Object.entries(expensesByCategory)) {
    const budget = budgets[cat];
    if (budget && budget > 0) {
      const percent = Math.round((spent / budget) * 100);
      if (percent >= 80) {
        alerts.push({
          category: cat,
          spent,
          budget,
          percent,
          isOverBudget: percent >= 100,
          isNearLimit: percent >= 80 && percent < 100
        });
      }
    }
  }

  return alerts.sort((a, b) => b.percent - a.percent);
}
