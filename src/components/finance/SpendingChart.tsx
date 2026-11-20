import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../theme/tokens';
import { formatCurrency } from '../../features/finance/api';

const CATEGORY_COLORS: Record<string, string> = {
  'UPI & Digital Payments': '#6957E8',
  'Food & Dining': '#F59E0B',
  'Groceries & Kirana': '#10B981',
  'Rent & Housing': '#3B82F6',
  'Electricity & Utilities': '#6366F1',
  'Mobile & Recharge': '#8B5CF6',
  'Fuel & Auto/Metro': '#EC4899',
  'Shopping & Lifestyle': '#F43F5E',
  'EMI & Loans': '#EF4444',
  'SIP & Mutual Funds': '#14B8A6',
  'Health & Medical': '#06B6D4',
  'Education & Fees': '#84CC16',
  'Other Spends': '#6B7280'
};

interface Props {
  totalIncome: number;
  totalExpenses: number;
  byCategory: Record<string, number>;
  currency?: string;
}

export function SpendingChart({ totalIncome, totalExpenses, byCategory, currency = 'INR' }: Props) {
  const { theme } = useTheme();

  const sortedCategories = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle, ...shadows.sm }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text.primary }]}>Monthly Financial Flow</Text>
          <Text style={[styles.sub, { color: theme.text.tertiary }]}>Indian Rupee (INR) Allocation</Text>
        </View>
        <View style={[styles.savingsBadge, { backgroundColor: savingsRate >= 20 ? theme.successBg : theme.surface.inset }]}>
          <Text style={[styles.savingsTxt, { color: savingsRate >= 20 ? theme.success : theme.text.secondary }]}>
            {savingsRate}% Saved
          </Text>
        </View>
      </View>

      {/* Income vs Expense Horizontal Comparison Bar */}
      <View style={styles.barCompareSec}>
        <View style={styles.barLabels}>
          <Text style={[styles.barLbl, { color: theme.text.secondary }]}>
            Income: {formatCurrency(totalIncome, currency)}
          </Text>
          <Text style={[styles.barLbl, { color: theme.text.secondary }]}>
            Expenses: {formatCurrency(totalExpenses, currency)}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.surface.inset }]}>
          <View
            style={[
              styles.fillIncome,
              {
                width: `${totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 0}%`,
                backgroundColor: totalExpenses > totalIncome ? theme.error : theme.brand.primary
              }
            ]}
          />
        </View>
      </View>

      {/* Category Allocation Progress Bars */}
      {sortedCategories.length > 0 ? (
        <View style={styles.catBreakdown}>
          <Text style={[styles.secTitle, { color: theme.text.secondary }]}>Top Spends Breakdown</Text>
          {sortedCategories.map(([cat, amt]) => {
            const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
            const barColor = CATEGORY_COLORS[cat] ?? theme.brand.primary;
            const isHighSpend = pct >= 35;

            return (
              <View key={cat} style={styles.catItem}>
                <View style={styles.catInfoRow}>
                  <View style={styles.catNameWrap}>
                    <View style={[styles.dot, { backgroundColor: barColor }]} />
                    <Text style={[styles.catName, { color: theme.text.primary }]} numberOfLines={1}>
                      {cat}
                    </Text>
                    {isHighSpend && (
                      <View style={[styles.alertBadge, { backgroundColor: theme.errorBg }]}>
                        <Text style={[styles.alertTxt, { color: theme.error }]}>High</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.catAmt, { color: theme.text.primary }]}>
                    {formatCurrency(amt, currency)} <Text style={{ color: theme.text.tertiary }}>({pct}%)</Text>
                  </Text>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: theme.surface.inset }]}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyNote}>
          <Ionicons name="pie-chart-outline" size={24} color={theme.text.tertiary} />
          <Text style={[styles.emptyNoteTxt, { color: theme.text.tertiary }]}>
            Add income or expense transactions to view visual spending analytics.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing[5], borderRadius: radius.xl, borderWidth: 1, gap: spacing[4] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  sub: { fontSize: fontSize.xs, marginTop: 2 },
  savingsBadge: { paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: radius.full },
  savingsTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  barCompareSec: { gap: spacing[2] },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barLbl: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  track: { height: 8, borderRadius: radius.full, overflow: 'hidden' },
  fillIncome: { height: '100%', borderRadius: radius.full },
  catBreakdown: { gap: spacing[3], paddingTop: spacing[1] },
  secTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  catItem: { gap: 6 },
  catInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catNameWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1, marginRight: spacing[2] },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  catName: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  alertBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm },
  alertTxt: { fontSize: 9, fontWeight: fontWeight.bold },
  catAmt: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  progressTrack: { height: 6, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full },
  emptyNote: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  emptyNoteTxt: { flex: 1, fontSize: fontSize.xs }
});
