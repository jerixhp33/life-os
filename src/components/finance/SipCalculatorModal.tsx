import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../theme/tokens';
import { formatCurrency } from '../../features/finance/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  currency?: string;
}

const AMOUNT_PRESETS = [2500, 5000, 10000, 25000];
const YEAR_PRESETS = [5, 10, 15, 20];

export function SipCalculatorModal({ visible, onClose, currency = 'INR' }: Props) {
  const { theme } = useTheme();

  const [monthlyStr, setMonthlyStr] = useState('5000');
  const [returnStr, setReturnStr] = useState('12');
  const [years, setYears] = useState(10);

  const monthlyInvestment = parseFloat(monthlyStr) || 0;
  const expectedReturnRate = parseFloat(returnStr) || 0;

  const result = useMemo(() => {
    if (monthlyInvestment <= 0 || expectedReturnRate <= 0 || years <= 0) {
      return { invested: 0, returns: 0, total: 0 };
    }

    const monthlyRate = expectedReturnRate / 12 / 100;
    const totalMonths = years * 12;
    const invested = Math.round(monthlyInvestment * totalMonths);

    const total = Math.round(
      monthlyInvestment *
        ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
        (1 + monthlyRate)
    );

    const returns = Math.max(0, total - invested);
    return { invested, returns, total };
  }, [monthlyInvestment, expectedReturnRate, years]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface.default }]}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Ionicons name="trending-up-outline" size={24} color={theme.brand.primary} />
              <Text style={[styles.title, { color: theme.text.primary }]}>SIP Wealth Calculator</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Monthly Investment Input */}
            <Input
              label="Monthly Investment (INR)"
              value={monthlyStr}
              onChangeText={setMonthlyStr}
              keyboardType="numeric"
              placeholder="5000"
            />

            {/* Quick Amount Chips */}
            <View style={styles.chipRow}>
              {AMOUNT_PRESETS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setMonthlyStr(amt.toString())}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        monthlyInvestment === amt ? theme.brand.primary : theme.surface.inset,
                      borderColor:
                        monthlyInvestment === amt ? theme.brand.primary : theme.border.subtle
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.chipTxt,
                      { color: monthlyInvestment === amt ? '#ffffff' : theme.text.secondary }
                    ]}
                  >
                    {formatCurrency(amt, currency)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Expected Return Rate */}
            <Input
              label="Expected Annual Return (%)"
              value={returnStr}
              onChangeText={setReturnStr}
              keyboardType="numeric"
              placeholder="12"
            />

            {/* Time Period Years */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>
                Time Period: {years} Years
              </Text>
              <View style={styles.chipRow}>
                {YEAR_PRESETS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setYears(y)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: years === y ? theme.brand.primary : theme.surface.inset,
                        borderColor: years === y ? theme.brand.primary : theme.border.subtle
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipTxt,
                        { color: years === y ? '#ffffff' : theme.text.secondary }
                      ]}
                    >
                      {y} Years
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Projected Corpus Result Card */}
            <View
              style={[
                styles.resultCard,
                { backgroundColor: theme.surface.inset, borderColor: theme.border.subtle }
              ]}
            >
              <Text style={[styles.resCorpusLabel, { color: theme.text.secondary }]}>
                Total Expected Future Corpus
              </Text>
              <Text style={[styles.resCorpusValue, { color: theme.brand.primary }]}>
                {formatCurrency(result.total, currency)}
              </Text>

              <View style={styles.resDivider} />

              <View style={styles.resRow}>
                <Text style={[styles.resItemLabel, { color: theme.text.tertiary }]}>
                  Amount Invested
                </Text>
                <Text style={[styles.resItemVal, { color: theme.text.primary }]}>
                  {formatCurrency(result.invested, currency)}
                </Text>
              </View>

              <View style={styles.resRow}>
                <Text style={[styles.resItemLabel, { color: theme.text.tertiary }]}>
                  Estimated Wealth Generated
                </Text>
                <Text style={[styles.resItemVal, { color: theme.success }]}>
                  +{formatCurrency(result.returns, currency)}
                </Text>
              </View>
            </View>

            <Button label="Done" onPress={onClose} variant="primary" size="lg" fullWidth />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  card: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing[6],
    maxHeight: '85%',
    gap: spacing[4]
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold
  },
  content: {
    gap: spacing[4],
    paddingBottom: spacing[4]
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing[2]
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap'
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1
  },
  chipTxt: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium
  },
  resultCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    gap: spacing[2],
    marginTop: spacing[2]
  },
  resCorpusLabel: {
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  resCorpusValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold
  },
  resDivider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.2)',
    marginVertical: spacing[1]
  },
  resRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resItemLabel: {
    fontSize: fontSize.sm
  },
  resItemVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold
  }
});
