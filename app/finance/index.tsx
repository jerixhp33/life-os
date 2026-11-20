import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, subMonths, addMonths } from 'date-fns';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { fetchMonthlyTransactions, buildSpendingSummary, formatCurrency, deleteTransaction } from '../../src/features/finance/api';
import { useAuthStore } from '../../src/stores/authStore';
import { SkeletonCard, EmptyState, ErrorState } from '../../src/components/feedback';
import { SpendingChart } from '../../src/components/finance/SpendingChart';
import { exportTransactionsToCSV } from '../../src/features/finance/export';
import { getCategoryBudgets, evaluateBudgets, DEFAULT_INDIAN_BUDGETS } from '../../src/features/finance/budgets';
import { BudgetAlertBanner } from '../../src/components/finance/BudgetAlertBanner';
import { SipCalculatorModal } from '../../src/components/finance/SipCalculatorModal';
import { UpiPaymentModal } from '../../src/components/finance/UpiPaymentModal';
import type { Transaction, TransactionType } from '../../src/types';

export default function FinanceScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);
  const currency = useAuthStore((s) => s.profile?.currency ?? 'INR');

  const [monthOffset, setMonthOffset] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isSipOpen, setIsSipOpen] = useState(false);
  const [isUpiOpen, setIsUpiOpen] = useState(false);
  const [budgets, setBudgets] = useState(DEFAULT_INDIAN_BUDGETS);

  useEffect(() => {
    getCategoryBudgets().then(setBudgets);
  }, []);

  const currentMonthDate = useMemo(() => subMonths(new Date(), monthOffset), [monthOffset]);

  const { data: txs, isLoading, error, refetch } = useQuery<Transaction[]>({
    queryKey: ['transactions', uid, monthOffset],
    queryFn: () => fetchMonthlyTransactions(uid!, monthOffset),
    enabled: Boolean(uid)
  });

  const summary = useMemo(() => buildSpendingSummary(txs ?? [], currency), [txs, currency]);
  const budgetAlerts = useMemo(
    () => evaluateBudgets(summary.by_category, budgets),
    [summary.by_category, budgets]
  );

  const filteredTxs = useMemo(() => {
    return (txs ?? []).filter((t) => (filterType === 'all' ? true : t.type === filterType));
  }, [txs, filterType]);

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const handleDelete = (t: Transaction) => {
    Alert.alert('Delete Entry', `Delete ${t.type} "${t.category}: ${formatCurrency(t.amount, currency)}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(t.id) }
    ]);
  };

  return (
    <ScreenLayout
      title="Finance"
      showBack
      rightAction={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={() => setIsUpiOpen(true)}
            style={s.addBtn}
            accessibilityLabel="UPI Quick Pay"
          >
            <Ionicons name="qr-code-outline" size={20} color={theme.brand.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsSipOpen(true)}
            style={s.addBtn}
            accessibilityLabel="SIP Calculator"
          >
            <Ionicons name="trending-up-outline" size={20} color={theme.brand.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              if (!txs || txs.length === 0) {
                Alert.alert('Export', 'No transactions found for this month to export.');
                return;
              }
              try {
                await exportTransactionsToCSV(txs, currency);
              } catch (e) {
                Alert.alert('Export Error', 'Could not export transactions.');
              }
            }}
            style={s.addBtn}
            accessibilityLabel="Export CSV"
          >
            <Ionicons name="download-outline" size={20} color={theme.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/finance/new')}
            style={s.addBtn}
            accessibilityLabel="Add transaction"
          >
            <Ionicons name="add" size={24} color={theme.brand.primary} />
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Month Selector Bar */}
        <View style={[s.monthBar, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity
            onPress={() => setMonthOffset((m) => m + 1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[s.monthTitle, { color: theme.text.primary }]}>
            {format(currentMonthDate, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity
            onPress={() => setMonthOffset((m) => Math.max(0, m - 1))}
            disabled={monthOffset === 0}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Next month"
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={monthOffset === 0 ? theme.text.disabled : theme.text.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Financial Balance Summary Card */}
        <View style={[s.balanceCard, { backgroundColor: theme.surface.default, ...shadows.sm }]}>
          <Text style={[s.balLabel, { color: theme.text.tertiary }]}>Net Savings</Text>
          <Text style={[s.balValue, { color: summary.net >= 0 ? theme.success : theme.error }]}>
            {formatCurrency(summary.net, currency)}
          </Text>
          <View style={s.summaryRow}>
            <View style={s.sumCol}>
              <View style={s.colHead}>
                <Ionicons name="arrow-down-circle" size={16} color={theme.success} />
                <Text style={[s.colLbl, { color: theme.text.secondary }]}>Income</Text>
              </View>
              <Text style={[s.incomeTxt, { color: theme.success }]}>
                {formatCurrency(summary.total_income, currency)}
              </Text>
            </View>
            <View style={[s.vDivider, { backgroundColor: theme.border.subtle }]} />
            <View style={s.sumCol}>
              <View style={s.colHead}>
                <Ionicons name="arrow-up-circle" size={16} color={theme.error} />
                <Text style={[s.colLbl, { color: theme.text.secondary }]}>Expenses</Text>
              </View>
              <Text style={[s.expenseTxt, { color: theme.error }]}>
                {formatCurrency(summary.total_expenses, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Budget Limit Warnings Banner */}
        <BudgetAlertBanner alerts={budgetAlerts} currency={currency} />

        {/* Monthly Financial Visual Analytics */}
        <SpendingChart
          totalIncome={summary.total_income}
          totalExpenses={summary.total_expenses}
          byCategory={summary.by_category}
          currency={currency}
        />

        {/* Filter chips */}
        <View style={s.filterRow}>
          {(['all', 'expense', 'income'] as const).map((ft) => (
            <TouchableOpacity
              key={ft}
              onPress={() => setFilterType(ft)}
              style={[
                s.chip,
                {
                  backgroundColor: filterType === ft ? theme.brand.primary : theme.surface.inset,
                  borderColor: filterType === ft ? theme.brand.primary : theme.border.subtle
                }
              ]}
            >
              <Text
                style={{
                  color: filterType === ft ? '#ffffff' : theme.text.secondary,
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.medium
                }}
              >
                {ft === 'all' ? 'All Transactions' : ft[0].toUpperCase() + ft.slice(1) + 's'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions list */}
        <View style={s.listSec}>
          <View style={s.listHeader}>
            <Text style={[s.secTitle, { color: theme.text.primary }]}>History</Text>
            <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
              {filteredTxs.length} {filteredTxs.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>

          {isLoading ? (
            <View><SkeletonCard /><SkeletonCard /></View>
          ) : error ? (
            <ErrorState message="Could not load transactions." onRetry={refetch} />
          ) : filteredTxs.length === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title="No transactions"
              description="Tap + to record an income or expense."
              actionLabel="Add Entry"
              onAction={() => router.push('/finance/new')}
            />
          ) : (
            filteredTxs.map((t) => (
              <View
                key={t.id}
                style={[s.txCard, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle }]}
              >
                <View
                  style={[
                    s.txIconBox,
                    { backgroundColor: t.type === 'income' ? theme.successBg : theme.errorBg }
                  ]}
                >
                  <Ionicons
                    name={t.type === 'income' ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={t.type === 'income' ? theme.success : theme.error}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[s.txCat, { color: theme.text.primary }]}>{t.category}</Text>
                  {t.description && (
                    <Text style={[s.txDesc, { color: theme.text.secondary }]} numberOfLines={1}>
                      {t.description}
                    </Text>
                  )}
                  <Text style={[s.txDate, { color: theme.text.tertiary }]}>
                    {format(new Date(t.date), 'MMM d, yyyy')}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text
                    style={[
                      s.txAmount,
                      { color: t.type === 'income' ? theme.success : theme.text.primary }
                    ]}
                  >
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount, currency)}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(t)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={16} color={theme.text.tertiary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: spacing[12] }} />
      </ScrollView>

      <SipCalculatorModal
        visible={isSipOpen}
        onClose={() => setIsSipOpen(false)}
        currency={currency}
      />

      <UpiPaymentModal
        visible={isUpiOpen}
        onClose={() => setIsUpiOpen(false)}
        currency={currency}
      />
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing[5], gap: spacing[4] },
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing[3], borderBottomWidth: 1 },
  monthTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  balanceCard: { padding: spacing[5], borderRadius: radius.xl, gap: spacing[2], alignItems: 'center' },
  balLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  balValue: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold },
  summaryRow: { flexDirection: 'row', width: '100%', marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  sumCol: { flex: 1, alignItems: 'center', gap: 2 },
  colHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  colLbl: { fontSize: fontSize.xs },
  incomeTxt: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  expenseTxt: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  vDivider: { width: 1, height: '80%', alignSelf: 'center' },
  catBreakdownCard: { padding: spacing[4], borderRadius: radius.xl, borderWidth: 1, gap: spacing[3] },
  breakdownTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  catRow: { gap: 4 },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  catAmt: { fontSize: fontSize.xs },
  barBg: { height: 6, borderRadius: radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full },
  filterRow: { flexDirection: 'row', gap: spacing[2] },
  chip: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1 },
  listSec: { gap: spacing[3] },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  txCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.lg, borderWidth: 1 },
  txIconBox: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  txCat: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  txDesc: { fontSize: fontSize.xs, marginTop: 2 },
  txDate: { fontSize: fontSize.xs, marginTop: 2 },
  txAmount: { fontSize: fontSize.base, fontWeight: fontWeight.bold }
});
