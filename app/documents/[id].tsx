import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { fetchDocument, deleteDocument, getDocumentDownloadUrl } from '../../src/features/documents/api';
import { SkeletonCard, ErrorState } from '../../src/components/feedback';
import { Button } from '../../src/components/ui/Button';
import type { Document } from '../../src/types';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();

  const { data: doc, isLoading, error, refetch } = useQuery<Document>({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id!),
    enabled: Boolean(id)
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteDocument(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      router.back();
    }
  });

  const handleDelete = () => {
    Alert.alert('Delete Document', 'Are you sure you want to permanently delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate() }
    ]);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!doc?.storage_path) {
      Alert.alert('Notice', 'No storage path found for this document.');
      return;
    }
    setDownloading(true);
    try {
      const url = await getDocumentDownloadUrl(doc.storage_path);
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Download Error', 'Could not obtain download URL.');
      }
    } catch {
      Alert.alert('Download Error', 'Failed to retrieve document from cloud storage.');
    } finally {
      setDownloading(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <ScreenLayout title="Document Details" showBack>
      {isLoading ? (
        <View style={s.pad}><SkeletonCard /><SkeletonCard /></View>
      ) : error || !doc ? (
        <ErrorState message="Could not load document." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Header Preview Card */}
          <View style={[s.previewCard, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle, ...shadows.sm }]}>
            <View style={[s.iconBox, { backgroundColor: theme.brand.primaryBg }]}>
              <Ionicons name="document-text" size={36} color={theme.brand.primary} />
            </View>
            <Text style={[s.docTitle, { color: theme.text.primary }]}>{doc.title}</Text>
            <Text style={[s.docFile, { color: theme.text.tertiary }]}>{doc.file_name}</Text>
            <View style={[s.catChip, { backgroundColor: theme.surface.inset }]}>
              <Text style={[s.catTxt, { color: theme.brand.primary }]}>{doc.category.toUpperCase()}</Text>
            </View>
          </View>

          {/* Action button: Download / Open */}
          <Button
            label={downloading ? 'Accessing Vault...' : 'Download / View File'}
            onPress={handleDownload}
            loading={downloading}
            variant="primary"
            size="lg"
            fullWidth
          />

          {/* Details list */}
          <View style={[s.metaCard, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle }]}>
            <Text style={[s.metaHeader, { color: theme.text.primary }]}>File Specifications</Text>

            <View style={s.metaRow}>
              <Text style={[s.metaKey, { color: theme.text.secondary }]}>File Size</Text>
              <Text style={[s.metaVal, { color: theme.text.primary }]}>{formatSize(doc.file_size)}</Text>
            </View>
            <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

            <View style={s.metaRow}>
              <Text style={[s.metaKey, { color: theme.text.secondary }]}>Format</Text>
              <Text style={[s.metaVal, { color: theme.text.primary }]}>{doc.mime_type}</Text>
            </View>
            <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

            <View style={s.metaRow}>
              <Text style={[s.metaKey, { color: theme.text.secondary }]}>Upload Date</Text>
              <Text style={[s.metaVal, { color: theme.text.primary }]}>
                {format(new Date(doc.created_at), 'MMMM d, yyyy · h:mm a')}
              </Text>
            </View>
            <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

            <View style={s.metaRow}>
              <Text style={[s.metaKey, { color: theme.text.secondary }]}>Storage Path</Text>
              <Text style={[s.metaVal, { color: theme.text.tertiary }]} numberOfLines={1}>
                {doc.storage_path}
              </Text>
            </View>
          </View>

          {/* Description */}
          {doc.description && (
            <View style={[s.descCard, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle }]}>
              <Text style={[s.descTitle, { color: theme.text.primary }]}>Notes & Description</Text>
              <Text style={[s.descTxt, { color: theme.text.secondary }]}>{doc.description}</Text>
            </View>
          )}

          {/* Delete document button */}
          <Button
            label="Delete document"
            onPress={handleDelete}
            variant="destructive"
            size="md"
            style={{ marginTop: spacing[4] }}
          />

          <View style={{ height: spacing[12] }} />
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  pad: { padding: spacing[5] },
  content: { padding: spacing[5], gap: spacing[4] },
  previewCard: { alignItems: 'center', padding: spacing[6], borderRadius: radius.xl, borderWidth: 1, gap: spacing[2] },
  iconBox: { width: 68, height: 68, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[2] },
  docTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, textAlign: 'center' },
  docFile: { fontSize: fontSize.sm },
  catChip: { paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: radius.full, marginTop: spacing[1] },
  catTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.5 },
  metaCard: { padding: spacing[4], borderRadius: radius.lg, borderWidth: 1, gap: spacing[3] },
  metaHeader: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginBottom: spacing[1] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaKey: { fontSize: fontSize.sm },
  metaVal: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  div: { height: StyleSheet.hairlineWidth },
  descCard: { padding: spacing[4], borderRadius: radius.lg, borderWidth: 1, gap: spacing[2] },
  descTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  descTxt: { fontSize: fontSize.sm, lineHeight: 20 }
});
