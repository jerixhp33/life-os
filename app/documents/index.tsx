import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { fetchDocuments, createDocument, deleteDocument, uploadDocumentFile } from '../../src/features/documents/api';
import { useAuthStore } from '../../src/stores/authStore';
import { SkeletonCard, EmptyState, ErrorState } from '../../src/components/feedback';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import type { Document, DocumentCategory } from '../../src/types';

const CATEGORIES: Array<{ k: 'all' | DocumentCategory; l: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { k: 'all', l: 'All', icon: 'folder-outline' },
  { k: 'identity', l: 'Identity', icon: 'card-outline' },
  { k: 'finance', l: 'Finance', icon: 'receipt-outline' },
  { k: 'medical', l: 'Medical', icon: 'medkit-outline' },
  { k: 'legal', l: 'Legal', icon: 'shield-outline' },
  { k: 'work', l: 'Work', icon: 'briefcase-outline' },
  { k: 'education', l: 'Education', icon: 'school-outline' },
  { k: 'other', l: 'Other', icon: 'document-text-outline' }
];

export default function DocumentsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<'all' | DocumentCategory>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Document Form State
  const [newTitle, setNewTitle] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newCat, setNewCat] = useState<DocumentCategory>('identity');
  const [newDesc, setNewDesc] = useState('');
  const [pickedFile, setPickedFile] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);

  const { data: docs, isLoading, error, refetch } = useQuery<Document[]>({
    queryKey: ['documents', uid],
    queryFn: () => fetchDocuments(uid!),
    enabled: Boolean(uid)
  });

  const filtered = useMemo(() => {
    return (docs ?? []).filter((d) => {
      const matchSearch =
        !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.file_name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCat === 'all' || d.category === selectedCat;
      return matchSearch && matchCat;
    });
  }, [docs, search, selectedCat]);

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*'
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setPickedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size ?? 0,
          mimeType: asset.mimeType ?? 'application/pdf'
        });
        if (!newTitle) {
          const cleanTitle = asset.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setNewTitle(cleanTitle);
        }
      }
    } catch {
      Alert.alert('File Picker', 'Unable to access device file storage.');
    }
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim()) throw new Error('Document title is required.');
      let storagePath = '';
      let fileName = '';
      let fileSize = 0;
      let mimeType = 'application/pdf';

      if (pickedFile) {
        fileName = pickedFile.name;
        fileSize = pickedFile.size;
        mimeType = pickedFile.mimeType;
        storagePath = await uploadDocumentFile(uid!, pickedFile.uri, pickedFile.name, pickedFile.mimeType);
      } else {
        fileName = newFileName.trim() || `${newTitle.trim().toLowerCase().replace(/\s+/g, '_')}.pdf`;
        fileSize = 1024 * 128;
        storagePath = `${uid}/${Date.now()}_${fileName}`;
      }

      return createDocument(uid!, {
        title: newTitle.trim(),
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        storage_path: storagePath,
        category: newCat,
        description: newDesc.trim() || undefined
      });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setNewTitle('');
      setNewFileName('');
      setNewDesc('');
      setPickedFile(null);
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not add document.')
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const handleDelete = (doc: Document) => {
    Alert.alert('Delete Document', `Delete "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(doc.id) }
    ]);
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <ScreenLayout
      title="Documents & Vault"
      showBack
      rightAction={
        <TouchableOpacity onPress={() => setIsModalOpen(true)} style={s.addBtn} accessibilityLabel="Upload document">
          <Ionicons name="add" size={24} color={theme.brand.primary} />
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <Input
          placeholder="Search documents..."
          value={search}
          onChangeText={setSearch}
          showClearButton
          prefix={<Ionicons name="search-outline" size={18} color={theme.text.tertiary} />}
          containerStyle={{ marginBottom: 0 }}
        />

        {/* Categories Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catBar}>
          {CATEGORIES.map((c) => {
            const active = selectedCat === c.k;
            return (
              <TouchableOpacity
                key={c.k}
                onPress={() => setSelectedCat(c.k)}
                style={[
                  s.catChip,
                  {
                    backgroundColor: active ? theme.brand.primary : theme.surface.inset,
                    borderColor: active ? theme.brand.primary : theme.border.subtle
                  }
                ]}
              >
                <Ionicons name={c.icon} size={15} color={active ? '#ffffff' : theme.text.tertiary} />
                <Text style={{ color: active ? '#ffffff' : theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                  {c.l}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Documents List */}
        <View style={s.docSec}>
          <View style={s.secHeader}>
            <Text style={[s.secTitle, { color: theme.text.primary }]}>Stored Files</Text>
            <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
              {filtered.length} {filtered.length === 1 ? 'file' : 'files'}
            </Text>
          </View>

          {isLoading ? (
            <View><SkeletonCard /><SkeletonCard /></View>
          ) : error ? (
            <ErrorState message="Could not load documents." onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="folder-outline"
              title={search ? 'No documents found' : 'No documents yet'}
              description={search ? 'Try another search keyword.' : 'Store identification, tax, or legal records safely.'}
              actionLabel="Add Document"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            filtered.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                onPress={() => router.push(`/documents/${doc.id}` as never)}
                style={[s.docCard, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle, ...shadows.sm }]}
              >
                <View style={[s.iconBox, { backgroundColor: theme.brand.primaryBg }]}>
                  <Ionicons name="document-text-outline" size={24} color={theme.brand.primary} />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.docTitle, { color: theme.text.primary }]} numberOfLines={1}>
                    {doc.title}
                  </Text>
                  <Text style={[s.docMeta, { color: theme.text.tertiary }]}>
                    {doc.file_name} · {formatSize(doc.file_size)}
                  </Text>
                  <View style={s.badgeRow}>
                    <View style={[s.catBadge, { backgroundColor: theme.surface.inset }]}>
                      <Text style={[s.catBadgeTxt, { color: theme.text.secondary }]}>{doc.category}</Text>
                    </View>
                    <Text style={[s.dateTxt, { color: theme.text.tertiary }]}>
                      {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleDelete(doc)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={theme.text.tertiary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: spacing[12] }} />
      </ScrollView>

      {/* Add Document Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: theme.surface.default }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text.primary }]}>Add Document to Vault</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing[3] }}>
              {/* Device File Picker Button */}
              <TouchableOpacity
                onPress={handlePickFile}
                style={[
                  s.filePickerBtn,
                  {
                    backgroundColor: pickedFile ? theme.successBg : theme.surface.inset,
                    borderColor: pickedFile ? theme.success : theme.border.default
                  }
                ]}
              >
                <Ionicons
                  name={pickedFile ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={24}
                  color={pickedFile ? theme.success : theme.brand.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.filePickerTitle, { color: theme.text.primary }]} numberOfLines={1}>
                    {pickedFile ? pickedFile.name : 'Select File from Device'}
                  </Text>
                  <Text style={[s.filePickerSub, { color: theme.text.tertiary }]}>
                    {pickedFile ? `${formatSize(pickedFile.size)} · Tap to change` : 'Choose PDF, photo, or document'}
                  </Text>
                </View>
              </TouchableOpacity>

              <Input
                label="Document Title"
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Passport, Tax Statement 2026"
                autoFocus={!pickedFile}
              />

              {!pickedFile && (
                <Input
                  label="File Name (optional)"
                  value={newFileName}
                  onChangeText={setNewFileName}
                  placeholder="document.pdf"
                />
              )}

              <View>
                <Text style={[s.label, { color: theme.text.secondary }]}>Category</Text>
                <View style={s.modalCatRow}>
                  {CATEGORIES.filter((c) => c.k !== 'all').map((c) => (
                    <TouchableOpacity
                      key={c.k}
                      onPress={() => setNewCat(c.k as DocumentCategory)}
                      style={[
                        s.catChip,
                        {
                          backgroundColor: newCat === c.k ? theme.brand.primary : theme.surface.inset,
                          borderColor: newCat === c.k ? theme.brand.primary : theme.border.subtle
                        }
                      ]}
                    >
                      <Text style={{ color: newCat === c.k ? '#ffffff' : theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                        {c.l}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input
                label="Description (optional)"
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="Notes, expiry dates, or reference numbers..."
                multiline
                numberOfLines={2}
              />

              <Button
                label={createMut.isPending ? 'Uploading to Vault...' : 'Save to Vault'}
                onPress={() => createMut.mutate()}
                loading={createMut.isPending}
                variant="primary"
                size="lg"
                fullWidth
                style={{ marginTop: spacing[3] }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing[5], gap: spacing[4] },
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  catBar: { gap: spacing[2], paddingVertical: 2 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1 },
  docSec: { gap: spacing[3] },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.lg, borderWidth: 1 },
  iconBox: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  docTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  docMeta: { fontSize: fontSize.xs },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 2 },
  catBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.sm },
  catBadgeTxt: { fontSize: 10, fontWeight: fontWeight.medium },
  dateTxt: { fontSize: fontSize.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], padding: spacing[6], maxHeight: '85%', gap: spacing[4] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[1] },
  modalCatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  filePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed'
  },
  filePickerTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  filePickerSub: { fontSize: fontSize.xs, marginTop: 2 }
});
