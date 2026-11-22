import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { format, subMonths } from 'date-fns';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import {
  fetchMonthlyTransactions,
  buildSpendingSummary,
  formatCurrency,
  deleteTransaction,
  createTransaction,
} from '../../src/features/finance/api';
import { useAuthStore } from '../../src/stores/authStore';
import { SkeletonCard, EmptyState, ErrorState } from '../../src/components/feedback';
import { SpendingChart } from '../../src/components/finance/SpendingChart';
import { exportTransactionsToCSV } from '../../src/features/finance/export';
import {
  getCategoryBudgets,
  evaluateBudgets,
  DEFAULT_INDIAN_BUDGETS,
} from '../../src/features/finance/budgets';
import { BudgetAlertBanner } from '../../src/components/finance/BudgetAlertBanner';
import { SipCalculatorModal } from '../../src/components/finance/SipCalculatorModal';
import { UpiPaymentModal } from '../../src/components/finance/UpiPaymentModal';
import { OmniCaptureBar } from '../../src/components/intelligence/OmniCaptureBar';
import { pickAndScanReceipt } from '../../src/lib/intelligence/receiptScanner';
import { AppBackground } from '../../src/components/layout/AppBackground';
import type { Transaction } from '../../src/types';

const CATEGORY_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; gradient: [string, string] }> = {
  'Food & Dining': { icon: 'restaurant', gradient: ['#2563EB', '#38BDF8'] },
  Transportation:  { icon: 'car', gradient: ['#0284C7', '#38BDF8'] },
  Groceries:       { icon: 'cart', gradient: ['#10B981', '#34D399'] },
  Entertainment:   { icon: 'film', gradient: ['#8B5CF6', '#A855F7'] },
  Utilities:       { icon: 'flash', gradient: ['#6366F1', '#818CF8'] },
  Healthcare:      { icon: 'medkit', gradient: ['#EC4899', '#F43F5E'] },
  Salary:          { icon: 'wallet', gradient: ['#059669', '#10B981'] },
  Investment:      { icon: 'trending-up', gradient: ['#0891B2', '#06B6D4'] },
  General:         { icon: 'receipt', gradient: ['#475569', '#64748B'] },
};

export default function FinanceScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id ?? s.profile?.id);
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
    enabled: Boolean(uid),
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
    },
  });

  const handleDelete = (t: Transaction) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete Entry', `Delete ${t.type} "${t.category}: ${formatCurrency(t.amount, currency)}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(t.id) },
    ]);
  };

  const handleScanReceipt = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const scanned = await pickAndScanReceipt(currency);
    if (!scanned || !uid) return;

    Alert.alert(
      'Receipt Detected',
      `Merchant: ${scanned.merchant}\nCategory: ${scanned.category}\nAmount: ${currency} ${scanned.amount}\n\nWould you like to log this expense?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Expense',
          onPress: async () => {
            try {
              await createTransaction(uid, {
                type: 'expense',
                amount: scanned.amount,
                currency,
                category: scanned.category,
                description: scanned.merchant,
                date: scanned.date,
                is_recurring: false,
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              qc.invalidateQueries({ queryKey: ['transactions'] });
            } catch {
              Alert.alert('Error', 'Could not save scanned transaction.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {/* 4K Blurred Organic U-Shape Wallpaper Background */}
      <AppBackground screenName="finance" />

      {/* ============================================================== */}
      {/* 1. TOP HEADER WITH GLASS ACTION BUTTONS                        */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={s.headerTagRow}>
            <View
              style={[
                s.headerBadge,
                {
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.10)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.30)' : 'rgba(2, 132, 199, 0.20)',
                },
              ]}
            >
              <Ionicons name="wallet" size={11} color={isDark ? '#38BDF8' : '#0284C7'} />
              <Text style={[s.headerBadgeText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                Wealth & Expenses
              </Text>
            </View>
          </View>
          <Text style={[s.title, { color: theme.text.primary }]}>Finance & Budget</Text>
        </View>

        {/* Top Actions: Receipt Scan, UPI, SIP, Add */}
        <View style={s.headerActions}>
          {/* Scan Receipt Action Button */}
          <TouchableOpacity
            onPress={handleScanReceipt}
            style={[
              s.topGlassBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
            accessibilityLabel="Scan Receipt"
          >
            <Ionicons name="scan-outline" size={17} color={theme.brand.primary} />
          </TouchableOpacity>

          {/* UPI Quick Pay */}
          <TouchableOpacity
            onPress={() => setIsUpiOpen(true)}
            style={[
              s.topGlassBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
            accessibilityLabel="UPI Pay"
          >
            <Ionicons name="qr-code-outline" size={17} color="#0284C7" />
          </TouchableOpacity>

          {/* SIP Calculator */}
          <TouchableOpacity
            onPress={() => setIsSipOpen(true)}
            style={[
              s.topGlassBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
            accessibilityLabel="SIP Calculator"
          >
            <Ionicons name="calculator-outline" size={17} color="#10B981" />
          </TouchableOpacity>

          {/* + New Transaction Pill Button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/finance/new');
            }}
            style={s.addBtnContainer}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2563EB', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.addBtnGradient}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ============================================================== */}
        {/* 2. UNIVERSAL OMNI-BOX (FAST EXPENSE / INCOME LOGGING)          */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(60)}>
          <OmniCaptureBar
            placeholder="e.g. Spent 350 Rs at Swiggy for lunch via UPI"
            onSuccess={() => refetch()}
          />
        </Animated.View>

        {/* ============================================================== */}
        {/* 3. MONTH SELECTOR SWITCHER (FROSTED CAPSULE)                   */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(90)} style={s.monthBarWrap}>
          <View
            style={[
              s.monthBar,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setMonthOffset((m) => m + 1);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={s.monthArrow}
            >
              <Ionicons name="chevron-back" size={18} color={theme.text.primary} />
            </TouchableOpacity>

            <Text style={[s.monthTitle, { color: theme.text.primary }]}>
              {format(currentMonthDate, 'MMMM yyyy')}
            </Text>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setMonthOffset((m) => Math.max(0, m - 1));
              }}
              disabled={monthOffset === 0}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={s.monthArrow}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={monthOffset === 0 ? (isDark ? '#64748B' : '#CBD5E1') : theme.text.primary}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* 4. THREE GLOSSY KPI CARDS (NET SAVINGS, INCOME, EXPENSES)      */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(120)} style={s.kpiRow}>
          {/* Net Savings */}
          <View
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: summary.net >= 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)' }]}>
              <Ionicons
                name={summary.net >= 0 ? 'shield-checkmark' : 'alert-circle'}
                size={16}
                color={summary.net >= 0 ? '#10B981' : '#EF4444'}
              />
            </View>
            <Text
              style={[
                s.kpiNumber,
                { color: summary.net >= 0 ? '#10B981' : '#EF4444', fontSize: 15 },
              ]}
              numberOfLines={1}
            >
              {formatCurrency(summary.net, currency)}
            </Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Net Savings</Text>
          </View>

          {/* Total Income */}
          <View
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
              <Ionicons name="arrow-down-circle" size={16} color="#10B981" />
            </View>
            <Text style={[s.kpiNumber, { color: '#10B981', fontSize: 15 }]} numberOfLines={1}>
              {formatCurrency(summary.total_income, currency)}
            </Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Income</Text>
          </View>

          {/* Total Expenses */}
          <View
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.18)' }]}>
              <Ionicons name="arrow-up-circle" size={16} color="#EF4444" />
            </View>
            <Text style={[s.kpiNumber, { color: '#EF4444', fontSize: 15 }]} numberOfLines={1}>
              {formatCurrency(summary.total_expenses, currency)}
            </Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Expenses</Text>
          </View>
        </Animated.View>

        {/* Budget Limit Warnings Banner */}
        <BudgetAlertBanner alerts={budgetAlerts} currency={currency} />

        {/* Monthly Financial Visual Analytics in Frosted Card */}
        <Animated.View entering={FadeInUp.duration(400).delay(150)}>
          <View
            style={[
              s.chartCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <SpendingChart
              totalIncome={summary.total_income}
              totalExpenses={summary.total_expenses}
              byCategory={summary.by_category}
              currency={currency}
            />
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* 5. SEGMENTED FILTER PILL BAR                                    */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(180)}>
          <View
            style={[
              s.segmentBar,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.82)' : 'rgba(226, 232, 240, 0.65)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            {(['all', 'expense', 'income'] as const).map((ft) => {
              const isSelected = filterType === ft;
              return (
                <TouchableOpacity
                  key={ft}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFilterType(ft);
                  }}
                  activeOpacity={0.8}
                  style={[
                    s.segmentBtn,
                    isSelected && [
                      s.segmentBtnActive,
                      {
                        backgroundColor: isDark ? '#3B82F6' : '#FFFFFF',
                        ...shadows.sm,
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      s.segmentBtnText,
                      {
                        color: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? '#819BB3'
                          : '#64748B',
                        fontWeight: isSelected ? fontWeight.bold : fontWeight.medium,
                      },
                    ]}
                  >
                    {ft === 'all' ? 'All Entries' : ft === 'expense' ? 'Expenses' : 'Income'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* 6. TRANSACTIONS LIST                                           */}
        {/* ============================================================== */}
        <View style={s.txsList}>
          {isLoading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : !filteredTxs.length ? (
            <EmptyState
              icon="wallet-outline"
              title="No entries found"
              description="Log income or expense to track your cashflow."
              actionLabel="+ Add Entry"
              onAction={() => router.push('/finance/new')}
            />
          ) : (
            filteredTxs.map((t, index) => {
              const catMeta = CATEGORY_ICONS[t.category] ?? CATEGORY_ICONS.General;
              const isIncome = t.type === 'income';

              return (
                <Animated.View key={t.id} entering={FadeInUp.duration(380).delay(index * 30)}>
                  <View
                    style={[
                      s.txCard,
                      {
                        backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                        borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                        ...shadows.sm,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={catMeta.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.catSquircle}
                    >
                      <Ionicons name={catMeta.icon} size={18} color="#FFFFFF" />
                    </LinearGradient>

                    <View style={s.txBody}>
                      <Text style={[s.txTitle, { color: theme.text.primary }]} numberOfLines={1}>
                        {t.description || t.category}
                      </Text>
                      <View style={s.txMetaRow}>
                        <Text style={[s.txMetaText, { color: isDark ? '#819BB3' : '#64748B' }]}>
                          {t.category} · {format(new Date(t.date), 'MMM d')}
                        </Text>
                      </View>
                    </View>

                    {/* Amount & Delete */}
                    <View style={s.txRight}>
                      <Text
                        style={[
                          s.txAmount,
                          { color: isIncome ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(t.amount, currency)}
                      </Text>

                      <TouchableOpacity
                        onPress={() => handleDelete(t)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={s.txDeleteBtn}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={15}
                          color={isDark ? '#64748B' : '#94A3B8'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* SIP & UPI Modals */}
      <SipCalculatorModal visible={isSipOpen} onClose={() => setIsSipOpen(false)} currency={currency} />
      <UpiPaymentModal visible={isUpiOpen} onClose={() => setIsUpiOpen(false)} currency={currency} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  ambientGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    overflow: 'hidden',
  },
  ambientGlow: { width: '100%', height: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  headerTagRow: { flexDirection: 'row', marginBottom: 4 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  headerBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 0.3 },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, letterSpacing: -0.4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topGlassBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.sm,
  },
  addBtnContainer: { borderRadius: radius.full, overflow: 'hidden', ...shadows.sm },
  addBtnGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[1],
    paddingBottom: 130, // Safe clearance for floating navigation dock
    gap: spacing[3],
  },
  monthBarWrap: { marginTop: 2 },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  monthArrow: { padding: 4 },
  monthTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpiCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.2,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiNumber: { fontWeight: fontWeight.bold, letterSpacing: -0.2 },
  kpiLabel: { fontSize: 10, fontWeight: fontWeight.medium, marginTop: 1 },
  chartCard: {
    borderRadius: 22,
    padding: spacing[3],
    borderWidth: 1.2,
  },
  segmentBar: { flexDirection: 'row', padding: 4, borderRadius: radius.full, borderWidth: 1 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  segmentBtnActive: { borderRadius: radius.full },
  segmentBtnText: { fontSize: 11 },
  txsList: { gap: 8, marginTop: 2 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing[3] + 2,
    borderRadius: 18,
    borderWidth: 1.2,
  },
  catSquircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  txBody: { flex: 1 },
  txTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  txMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  txMetaText: { fontSize: 11, fontWeight: fontWeight.medium },
  txRight: { alignItems: 'flex-end', gap: 2 },
  txAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  txDeleteBtn: { padding: 2 },
});
