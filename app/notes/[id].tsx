import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { fetchNote, updateNote, deleteNote } from '../../src/features/notes/api';
import { SkeletonCard, ErrorState } from '../../src/components/feedback';
import { Button } from '../../src/components/ui/Button';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();

  const { data: note, isLoading, error, refetch } = useQuery({
    queryKey: ['note', id],
    queryFn: () => fetchNote(id!),
    enabled: Boolean(id)
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [ctype, setCtype] = useState<'text' | 'checklist' | 'markdown'>('text');
  const [isFav, setIsFav] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (note) {
      setTitle(note.title ?? '');
      setContent(note.content ?? '');
      setCtype(note.content_type ?? 'text');
      setIsFav(note.is_favorite ?? false);
      setPinned(note.pinned ?? false);
      setTags(note.tags ?? []);
    }
  }, [note]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateNote(id!, {
        title: title.trim() || 'Untitled',
        content,
        content_type: ctype,
        is_favorite: isFav,
        pinned,
        tags
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['note', id] });
      qc.invalidateQueries({ queryKey: ['notes'] });
      Alert.alert('Saved', 'Note updated successfully.');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not save note.')
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteNote(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      router.back();
    }
  });

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate() }
    ]);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((p) => [...p, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setTags((p) => p.filter((x) => x !== t));
  };

  return (
    <ScreenLayout
      title="Edit Note"
      showBack
      rightAction={
        <TouchableOpacity
          onPress={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: theme.brand.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold }}>
            {saveMut.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      }
      keyboardAvoid
    >
      {isLoading ? (
        <View style={s.pad}><SkeletonCard /><SkeletonCard /></View>
      ) : error || !note ? (
        <ErrorState message="Could not load note." onRetry={refetch} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Action Bar: Favorite, Pin, Mode */}
            <View style={s.topBar}>
              <TouchableOpacity
                onPress={() => setPinned((p) => !p)}
                style={[s.iconToggle, { backgroundColor: pinned ? theme.brand.primaryBg : theme.surface.inset }]}
              >
                <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={18} color={pinned ? theme.brand.primary : theme.text.tertiary} />
                <Text style={{ color: pinned ? theme.brand.primary : theme.text.secondary, fontSize: fontSize.xs }}>
                  {pinned ? 'Pinned' : 'Pin'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsFav((f) => !f)}
                style={[s.iconToggle, { backgroundColor: isFav ? theme.errorBg : theme.surface.inset }]}
              >
                <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? theme.error : theme.text.tertiary} />
                <Text style={{ color: isFav ? theme.error : theme.text.secondary, fontSize: fontSize.xs }}>
                  {isFav ? 'Favorite' : 'Fav'}
                </Text>
              </TouchableOpacity>

              <View style={[s.typeSwitch, { backgroundColor: theme.surface.inset }]}>
                {(['text', 'checklist', 'markdown'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setCtype(t)}
                    style={[
                      s.typeBtn,
                      ctype === t && { backgroundColor: theme.surface.default, elevation: 1 }
                    ]}
                  >
                    <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: ctype === t ? theme.brand.primary : theme.text.tertiary }}>
                      {t === 'text' ? 'Plain' : t === 'checklist' ? 'Check' : 'MD'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note Title */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={theme.text.placeholder}
              style={[s.titleIn, { color: theme.text.primary }]}
            />

            {/* Note Meta */}
            <Text style={[s.metaTxt, { color: theme.text.tertiary }]}>
              Last modified {format(new Date(note.updated_at), 'MMMM d, yyyy · h:mm a')}
            </Text>

            {/* Content Input */}
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={
                ctype === 'markdown'
                  ? '# Header\n\nWrite details or use markdown syntax...'
                  : ctype === 'checklist'
                  ? '- [ ] Item 1\n- [ ] Item 2'
                  : 'Start typing note...'
              }
              placeholderTextColor={theme.text.placeholder}
              style={[s.contentIn, { color: theme.text.primary }]}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
            />

            {/* Tags section */}
            <View style={s.tagsSec}>
              <Text style={[s.tagsTitle, { color: theme.text.secondary }]}>Tags</Text>
              <View style={s.tagsWrap}>
                {tags.map((t) => (
                  <View key={t} style={[s.tagChip, { backgroundColor: theme.brand.primaryBg }]}>
                    <Text style={[s.tagTxt, { color: theme.brand.primary }]}>{t}</Text>
                    <TouchableOpacity onPress={() => removeTag(t)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close" size={12} color={theme.brand.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={[s.tagInputRow, { backgroundColor: theme.surface.inset }]}>
                <Ionicons name="pricetag-outline" size={16} color={theme.text.tertiary} />
                <TextInput
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add a tag..."
                  placeholderTextColor={theme.text.placeholder}
                  style={[s.tagIn, { color: theme.text.primary }]}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity onPress={addTag} style={s.tagAddBtn}>
                  <Ionicons name="add" size={18} color={theme.brand.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Delete note button */}
            <Button
              label="Delete note"
              onPress={handleDelete}
              variant="destructive"
              size="md"
              style={{ marginTop: spacing[6] }}
            />

            <View style={{ height: spacing[12] }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  pad: { padding: spacing[5] },
  content: { padding: spacing[5], gap: spacing[3], flexGrow: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  iconToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.md },
  typeSwitch: { flex: 1, flexDirection: 'row', borderRadius: radius.md, padding: 2, gap: 2 },
  typeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[1], borderRadius: radius.sm },
  titleIn: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, paddingVertical: spacing[2] },
  metaTxt: { fontSize: fontSize.xs, marginBottom: spacing[2] },
  contentIn: { fontSize: fontSize.base, lineHeight: 24, minHeight: 280, paddingVertical: spacing[2] },
  tagsSec: { gap: spacing[2], marginTop: spacing[4] },
  tagsTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: radius.full },
  tagTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], borderRadius: radius.md, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  tagIn: { flex: 1, fontSize: fontSize.sm },
  tagAddBtn: { padding: 4 }
});
