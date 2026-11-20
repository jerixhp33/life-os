import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { createTransaction } from '../../src/features/finance/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { UpiPaymentModal } from '../../src/components/finance/UpiPaymentModal';
import type { TransactionType } from '../../src/types';

const EXPENSE_CATEGORIES = [
  'UPI & Digital Payments',
  'Food & Dining',
  'Groceries & Kirana',
  'Rent & Housing',
  'Electricity & Utilities',
  'Mobile & Recharge',
  'Fuel & Auto/Metro',
  'Shopping & Lifestyle',
  'EMI & Loans',
  'SIP & Mutual Funds',
  'Health & Medical',
  'Education & Fees',
  'Other Spends'
];

const INCOME_CATEGORIES = [
  'Salary (Net)',
  'Freelance & Consulting',
  'Business Profit',
  'Rental Income',
  'Dividends & Interest',
  'Cashbacks & Rewards',
  'Gifts & Transfers',
  'Other Income'
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function NewTransactionScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);
  const currency = useAuthStore((s) => s.profile?.currency ?? 'INR');

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isUpiOpen, setIsUpiOpen] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleQuickAdd = (val: number) => {
    const cur = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    setAmount((cur + val).toString());
  };

  const createMut = useMutation({
    mutationFn: () => {
      const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0.');
      }
      return createTransaction(uid!, {
        type,
        amount: parsedAmount,
        currency,
        category,
        description: description.trim() || undefined,
        date: date.toISOString().split('T')[0],
        is_recurring: isRecurring
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      router.back();
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not record transaction.')
  });

  return (
    <ScreenLayout
      title="Add Transaction"
      showBack
      rightAction={
        <TouchableOpacity
          onPress={() => createMut.mutate()}
          disabled={createMut.isPending}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: theme.brand.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold }}>
            {createMut.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      }
      keyboardAvoid
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Type Switcher */}
        <View style={[s.typeSwitch, { backgroundColor: theme.surface.inset }]}>
          <TouchableOpacity
            onPress={() => {
              setType('expense');
              setCategory(EXPENSE_CATEGORIES[0]);
            }}
            style={[
              s.typeBtn,
              type === 'expense' && { backgroundColor: theme.errorBg, borderColor: theme.error, borderWidth: 1 }
            ]}
          >
            <Ionicons name="arrow-up-circle-outline" size={18} color={type === 'expense' ? theme.error : theme.text.tertiary} />
            <Text style={{ color: type === 'expense' ? theme.error : theme.text.secondary, fontWeight: fontWeight.semibold }}>
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setType('income');
              setCategory(INCOME_CATEGORIES[0]);
            }}
            style={[
              s.typeBtn,
              type === 'income' && { backgroundColor: theme.successBg, borderColor: theme.success, borderWidth: 1 }
            ]}
          >
            <Ionicons name="arrow-down-circle-outline" size={18} color={type === 'income' ? theme.success : theme.text.tertiary} />
            <Text style={{ color: type === 'income' ? theme.success : theme.text.secondary, fontWeight: fontWeight.semibold }}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Amount ({currency === 'INR' ? '₹' : currency})</Text>
          <Input
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            autoFocus
            prefix={<Text style={[s.currPrefix, { color: theme.brand.primary }]}>{currency === 'INR' ? '₹ ' : `${currency} `}</Text>}
          />
          {/* Quick preset chips */}
          <View style={s.quickRow}>
            {QUICK_AMOUNTS.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => handleQuickAdd(q)}
                style={[s.quickChip, { backgroundColor: theme.surface.inset, borderColor: theme.border.subtle }]}
              >
                <Text style={{ color: theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                  +₹{q.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Selector */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Category</Text>
          <View style={s.catWrap}>
            {categories.map((c) => {
              const selected = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    s.catChip,
                    {
                      backgroundColor: selected ? theme.brand.primary : theme.surface.inset,
                      borderColor: selected ? theme.brand.primary : theme.border.subtle
                    }
                  ]}
                >
                  <Text style={{ color: selected ? '#ffffff' : theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {type === 'expense' && category === 'UPI & Digital Payments' && (
            <TouchableOpacity
              onPress={() => setIsUpiOpen(true)}
              style={[
                s.upiBanner,
                { backgroundColor: theme.brand.primaryBg, borderColor: theme.brand.primary }
              ]}
            >
              <Ionicons name="qr-code-outline" size={20} color={theme.brand.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[s.upiBannerTitle, { color: theme.brand.primary }]}>
                  Pay with installed UPI app
                </Text>
                <Text style={[s.upiBannerSub, { color: theme.text.secondary }]}>
                  Launch Google Pay, PhonePe, or Paytm and auto-log
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.brand.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Selector */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[s.dateBtn, { backgroundColor: theme.surface.inset, borderColor: theme.border.default }]}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.text.tertiary} />
            <Text style={{ color: theme.text.primary, flex: 1, fontSize: fontSize.sm }}>
              {format(date, 'EEEE, MMMM d, yyyy')}
            </Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )}

        {/* Description / Note */}
        <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Store, client, or purpose..." />

        {/* Recurring Toggle */}
        <View style={[s.switchRow, { borderColor: theme.border.subtle }]}>
          <View>
            <Text style={[s.switchTitle, { color: theme.text.primary }]}>Recurring transaction</Text>
            <Text style={[s.switchSub, { color: theme.text.tertiary }]}>Monthly subscription or regular income</Text>
          </View>
          <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: theme.brand.primary }} />
        </View>

        <Button
          label={`Record ${type === 'expense' ? 'Expense' : 'Income'}`}
          onPress={() => createMut.mutate()}
          loading={createMut.isPending}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: spacing[4] }}
        />

        <View style={{ height: spacing[12] }} />
      </ScrollView>

      <UpiPaymentModal
        visible={isUpiOpen}
        onClose={() => setIsUpiOpen(false)}
        currency={currency}
        onSuccess={() => router.back()}
      />
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing[5], gap: spacing[4] },
  typeSwitch: { flexDirection: 'row', borderRadius: radius.xl, padding: 4, gap: spacing[2] },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: radius.lg },
  sec: { gap: spacing[2] },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  currPrefix: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[1] },
  quickChip: { paddingHorizontal: spacing[3], paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  catChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.md, borderWidth: 1 },
  upiBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.lg, borderWidth: 1, marginTop: spacing[1] },
  upiBannerTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  upiBannerSub: { fontSize: 11, marginTop: 1 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.md, borderWidth: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[3], borderTopWidth: 1, marginTop: spacing[2] },
  switchTitle: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  switchSub: { fontSize: fontSize.xs, marginTop: 2 }
});
