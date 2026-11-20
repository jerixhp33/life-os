import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../theme/tokens';
import { formatCurrency } from '../../features/finance/api';
import type { BudgetStatus } from '../../features/finance/budgets';

interface Props {
  alerts: BudgetStatus[];
  currency?: string;
}

export function BudgetAlertBanner({ alerts, currency = 'INR' }: Props) {
  const { theme } = useTheme();

  if (!alerts || alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      {alerts.slice(0, 2).map((a) => {
        const isExceeded = a.isOverBudget;
        return (
          <View
            key={a.category}
            style={[
              styles.card,
              {
                backgroundColor: isExceeded ? theme.errorBg : '#FEF3C7',
                borderColor: isExceeded ? theme.error : '#F59E0B'
              }
            ]}
          >
            <Ionicons
              name={isExceeded ? 'alert-circle' : 'warning-outline'}
              size={20}
              color={isExceeded ? theme.error : '#D97706'}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.title,
                  { color: isExceeded ? theme.error : '#92400E' }
                ]}
              >
                {isExceeded ? 'Budget Exceeded' : 'Budget Warning'} ({a.percent}%)
              </Text>
              <Text
                style={[
                  styles.desc,
                  { color: isExceeded ? theme.error : '#78350F' }
                ]}
              >
                {a.category}: {formatCurrency(a.spent, currency)} spent of {formatCurrency(a.budget, currency)} monthly cap.
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
    marginBottom: spacing[1]
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1
  },
  title: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold
  },
  desc: {
    fontSize: fontSize.xs,
    marginTop: 2
  }
});
