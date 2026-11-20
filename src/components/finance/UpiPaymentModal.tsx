import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../theme/tokens';
import { createTransaction, formatCurrency } from '../../features/finance/api';
import { launchUpiPayment, isValidVpa } from '../../features/finance/upi';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  currency?: string;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000];

export function UpiPaymentModal({ visible, onClose, currency = 'INR', onSuccess }: Props) {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id);

  const [vpa, setVpa] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [paying, setPaying] = useState(false);

  const parsedAmount = parseFloat(amountStr) || 0;

  const handlePreset = (amt: number) => {
    setAmountStr(amt.toString());
  };

  const handlePayAndLog = async () => {
    if (!vpa.trim() || !isValidVpa(vpa)) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI VPA (e.g. merchant@okaxis, 9876543210@paytm).');
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a payment amount greater than zero.');
      return;
    }

    setPaying(true);
    try {
      const opened = await launchUpiPayment({
        vpa: vpa.trim(),
        name: payeeName.trim() || undefined,
        amount: parsedAmount,
        note: note.trim() || undefined
      });

      if (opened && uid) {
        // Automatically log transaction in LifeOS
        await createTransaction(uid, {
          amount: parsedAmount,
          type: 'expense',
          category: 'UPI & Digital Payments',
          currency,
          is_recurring: false,
          description: `${payeeName.trim() || vpa.trim()}${note.trim() ? ` · ${note.trim()}` : ''}`,
          date: new Date().toISOString()
        });

        qc.invalidateQueries({ queryKey: ['transactions'] });
        onClose();
        setVpa('');
        setPayeeName('');
        setAmountStr('');
        setNote('');
        onSuccess?.();

        Alert.alert(
          'Payment Initiated',
          `Opened UPI app for ${formatCurrency(parsedAmount, currency)} and recorded entry in your Finance ledger.`
        );
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not launch payment.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface.default }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <View style={[styles.iconBox, { backgroundColor: theme.brand.primaryBg }]}>
                <Ionicons name="card" size={20} color={theme.brand.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text.primary }]}>Quick UPI Pay</Text>
                <Text style={[styles.sub, { color: theme.text.tertiary }]}>Pay via GPay, PhonePe, Paytm, or BHIM</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Payee VPA */}
            <Input
              label="Payee UPI ID (VPA)"
              placeholder="e.g. swiggy@icici, mobile@paytm"
              value={vpa}
              onChangeText={setVpa}
              autoCapitalize="none"
              autoCorrect={false}
              prefix={<Ionicons name="at-outline" size={18} color={theme.text.tertiary} />}
            />

            {/* Payee Name */}
            <Input
              label="Payee Name (Optional)"
              placeholder="Merchant or recipient name"
              value={payeeName}
              onChangeText={setPayeeName}
            />

            {/* Amount Input */}
            <Input
              label={`Amount (${currency})`}
              placeholder="0.00"
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="numeric"
              prefix={<Text style={[styles.currencyPrefix, { color: theme.text.primary }]}>₹</Text>}
            />

            {/* Quick Amount Chips */}
            <View style={styles.chipRow}>
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = parsedAmount === amt;
                return (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => handlePreset(amt)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? theme.brand.primary : theme.surface.inset,
                        borderColor: isSelected ? theme.brand.primary : theme.border.subtle
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipTxt,
                        { color: isSelected ? '#ffffff' : theme.text.secondary }
                      ]}
                    >
                      +{formatCurrency(amt, currency)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note */}
            <Input
              label="Payment Note / Description (Optional)"
              placeholder="e.g. Dinner, Grocery, Metro recharge"
              value={note}
              onChangeText={setNote}
            />

            {/* Info badge */}
            <View style={[styles.infoCard, { backgroundColor: theme.surface.inset, borderColor: theme.border.subtle }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.brand.primary} />
              <Text style={[styles.infoTxt, { color: theme.text.secondary }]}>
                Launches your phone's default UPI application and logs the expense under UPI & Digital Payments.
              </Text>
            </View>

            <Button
              label={paying ? 'Launching UPI App...' : 'Pay & Log Expense'}
              onPress={handlePayAndLog}
              loading={paying}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: spacing[2] }}
            />
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
    maxHeight: '88%',
    gap: spacing[4]
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold
  },
  sub: {
    fontSize: fontSize.xs,
    marginTop: 1
  },
  content: {
    gap: spacing[3],
    paddingBottom: spacing[4]
  },
  currencyPrefix: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginRight: 4
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
    marginTop: -spacing[1],
    marginBottom: spacing[1]
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radius.full,
    borderWidth: 1
  },
  chipTxt: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1
  },
  infoTxt: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 18
  }
});
