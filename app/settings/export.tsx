import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/authStore';
import { generateUltraPdfReport } from '../../src/lib/reports/ultraPdfReport';
import { exportFullLifeOsBackup, restoreFullLifeOsBackup } from '../../src/lib/backup/backupService';
import { exportTransactionsToCSV } from '../../src/features/finance/export';
import { fetchMonthlyTransactions } from '../../src/features/finance/api';
import { Button } from '../../src/components/ui/Button';

export default function ExportDataScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);
  const currency = useAuthStore((s) => s.profile?.currency ?? 'INR');

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [restoringJson, setRestoringJson] = useState(false);

  const handleGeneratePdf = async () => {
    if (!uid) return;
    setGeneratingPdf(true);
    try {
      await generateUltraPdfReport(uid, currency);
    } catch (e) {
      Alert.alert('PDF Generation Failed', e instanceof Error ? e.message : 'Could not compile PDF report.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleExportCsv = async () => {
    if (!uid) return;
    setExportingCsv(true);
    try {
      const txs = await fetchMonthlyTransactions(uid, 0);
      if (!txs || txs.length === 0) {
        Alert.alert('Notice', 'No transactions found for the current month.');
        return;
      }
      await exportTransactionsToCSV(txs, currency);
    } catch (e) {
      Alert.alert('CSV Export Failed', e instanceof Error ? e.message : 'Could not export CSV file.');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportJson = async () => {
    if (!uid) return;
    setExportingJson(true);
    try {
      await exportFullLifeOsBackup(uid);
    } catch (e) {
      Alert.alert('Backup Failed', e instanceof Error ? e.message : 'Could not compile backup archive.');
    } finally {
      setExportingJson(false);
    }
  };

  const handleRestoreBackup = () => {
    if (!uid) return;
    Alert.alert(
      'Restore Backup Data',
      'This will import and merge records from your JSON backup archive into your account. Existing matching records will be updated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Backup File',
          onPress: async () => {
            setRestoringJson(true);
            try {
              const res = await restoreFullLifeOsBackup(uid);
              if (res) {
                qc.invalidateQueries();
                Alert.alert(
                  'Restore Successful',
                  `Successfully restored ${res.tasksCount} tasks, ${res.notesCount} notes, ${res.habitsCount} habits, ${res.habitLogsCount} habit logs, and ${res.transactionsCount} transactions.`
                );
              }
            } catch (e) {
              Alert.alert('Restore Failed', e instanceof Error ? e.message : 'Could not restore backup archive.');
            } finally {
              setRestoringJson(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenLayout title="Export My Data" showBack>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card: Ultra PDF Report */}
        <View style={[s.card, s.heroCard, { backgroundColor: theme.surface.default, borderColor: theme.brand.primary, ...shadows.md }]}>
          <View style={s.cardHead}>
            <View style={[s.iconBox, { backgroundColor: theme.brand.primaryBg }]}>
              <Ionicons name="document-text" size={28} color={theme.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.tagRow}>
                <Text style={[s.cardTitle, { color: theme.text.primary }]}>Ultra PDF Life Report</Text>
                <View style={[s.ultraTag, { backgroundColor: theme.brand.primary }]}>
                  <Text style={s.ultraTagTxt}>RECOMMENDED</Text>
                </View>
              </View>
              <Text style={[s.cardSub, { color: theme.text.tertiary }]}>
                Executive print-ready A4 statement
              </Text>
            </View>
          </View>

          <Text style={[s.desc, { color: theme.text.secondary }]}>
            Compiles complete analytics, task health, Indian financial flow (INR), category breakdown meters, and daily habit routines into a visual printable PDF document.
          </Text>

          <View style={[s.featureList, { backgroundColor: theme.surface.inset }]}>
            <View style={s.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[s.featureTxt, { color: theme.text.secondary }]}>
                Executive KPI highlights & task completion score
              </Text>
            </View>
            <View style={s.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[s.featureTxt, { color: theme.text.secondary }]}>
                Visual income vs. expense flow bar and category meters
              </Text>
            </View>
            <View style={s.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[s.featureTxt, { color: theme.text.secondary }]}>
                Formatted in Indian Rupees (INR) with en-IN numbering
              </Text>
            </View>
            <View style={s.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[s.featureTxt, { color: theme.text.secondary }]}>
                A4 printable format suitable for sharing & archiving
              </Text>
            </View>
          </View>

          <Button
            label={generatingPdf ? 'Generating Ultra PDF...' : 'Generate Ultra PDF Report'}
            onPress={handleGeneratePdf}
            loading={generatingPdf}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>

        {/* Financial Spreadsheet Export */}
        <View style={[s.card, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle, ...shadows.sm }]}>
          <View style={s.cardHead}>
            <View style={[s.iconBox, { backgroundColor: theme.surface.inset }]}>
              <Ionicons name="stats-chart-outline" size={24} color={theme.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: theme.text.primary }]}>Financial CSV Statement</Text>
              <Text style={[s.cardSub, { color: theme.text.tertiary }]}>
                For Microsoft Excel, Numbers, and Google Sheets
              </Text>
            </View>
          </View>
          <Text style={[s.desc, { color: theme.text.secondary }]}>
            Exports all transactions recorded this month with date, transaction type, category, amount, and notes.
          </Text>
          <Button
            label={exportingCsv ? 'Exporting CSV...' : 'Export Transactions (CSV)'}
            onPress={handleExportCsv}
            loading={exportingCsv}
            variant="secondary"
            size="md"
            fullWidth
          />
        </View>

        {/* Full JSON Database Backup */}
        <View style={[s.card, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle, ...shadows.sm }]}>
          <View style={s.cardHead}>
            <View style={[s.iconBox, { backgroundColor: theme.surface.inset }]}>
              <Ionicons name="cloud-download-outline" size={24} color={theme.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: theme.text.primary }]}>Full Data Archive (JSON)</Text>
              <Text style={[s.cardSub, { color: theme.text.tertiary }]}>
                Complete backup of tasks, notes, habits, transactions & vault
              </Text>
            </View>
          </View>
          <Text style={[s.desc, { color: theme.text.secondary }]}>
            Download an encrypted structured JSON snapshot of all your personal records.
          </Text>
          <Button
            label={exportingJson ? 'Creating Backup Archive...' : 'Export Complete Backup (JSON)'}
            onPress={handleExportJson}
            loading={exportingJson}
            variant="secondary"
            size="md"
            fullWidth
          />
        </View>

        {/* Restore Backup Data */}
        <View style={[s.card, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle, ...shadows.sm }]}>
          <View style={s.cardHead}>
            <View style={[s.iconBox, { backgroundColor: theme.surface.inset }]}>
              <Ionicons name="cloud-upload-outline" size={24} color={theme.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: theme.text.primary }]}>Restore from Backup</Text>
              <Text style={[s.cardSub, { color: theme.text.tertiary }]}>
                Restore records from a saved LifeOS JSON backup file
              </Text>
            </View>
          </View>
          <Text style={[s.desc, { color: theme.text.secondary }]}>
            Select a previous LifeOS JSON backup file to merge tasks, notes, habits, habit logs, and transactions into your account.
          </Text>
          <Button
            label={restoringJson ? 'Restoring Data...' : 'Restore from Backup (JSON)'}
            onPress={handleRestoreBackup}
            loading={restoringJson}
            variant="secondary"
            size="md"
            fullWidth
          />
        </View>

        <View style={{ height: spacing[12] }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing[5], gap: spacing[4] },
  card: { padding: spacing[5], borderRadius: radius.xl, borderWidth: 1, gap: spacing[3] },
  heroCard: { borderWidth: 1.5 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconBox: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  ultraTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs },
  ultraTagTxt: { color: '#ffffff', fontSize: 9, fontWeight: fontWeight.bold },
  cardSub: { fontSize: fontSize.xs, marginTop: 2 },
  desc: { fontSize: fontSize.sm, lineHeight: 20 },
  featureList: { padding: spacing[3], borderRadius: radius.md, gap: spacing[2] },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  featureTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.medium }
});
