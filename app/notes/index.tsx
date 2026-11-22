import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
import {
  useNotes,
  useSearchNotes,
  useDeleteNote,
  useUpdateNote,
} from '../../src/features/notes/hooks';
import { OmniCaptureBar } from '../../src/components/intelligence/OmniCaptureBar';
import { AppBackground } from '../../src/components/layout/AppBackground';
import type { Note } from '../../src/types';

export default function NotesScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'favorites'>('all');

  const { data: notes, isLoading, refetch } = useNotes();
  const { data: sr } = useSearchNotes(search);
  const del = useDeleteNote();
  const upd = useUpdateNote();

  const allNotes = search.length > 1 ? sr ?? [] : notes ?? [];

  const totalCount = (notes ?? []).length;
  const pinnedCount = (notes ?? []).filter((n) => n.pinned).length;
  const favCount = (notes ?? []).filter((n) => n.is_favorite).length;

  const filtered = useMemo(() => {
    return allNotes.filter((n) => {
      if (filter === 'pinned') return n.pinned;
      if (filter === 'favorites') return n.is_favorite;
      return true;
    });
  }, [allNotes, filter]);

  const handleDelete = (n: Note) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete Note', `Delete "${n.title || 'Untitled'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => del.mutate(n.id),
      },
    ]);
  };

  const handleToggleFavorite = (n: Note) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    upd.mutate({ id: n.id, updates: { is_favorite: !n.is_favorite } });
  };

  const handleTogglePin = (n: Note) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    upd.mutate({ id: n.id, updates: { pinned: !n.pinned } });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {/* 4K Blurred Organic U-Shape Wallpaper Background */}
      <AppBackground screenName="notes" />

      {/* ============================================================== */}
      {/* 1. TOP HEADER WITH GLOSSY "+ NEW NOTE" BUTTON                  */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={s.headerTagRow}>
            <View
              style={[
                s.headerBadge,
                {
                  backgroundColor: isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(124, 58, 237, 0.10)',
                  borderColor: isDark ? 'rgba(168, 85, 247, 0.30)' : 'rgba(124, 58, 237, 0.20)',
                },
              ]}
            >
              <Ionicons name="document-text" size={11} color={isDark ? '#C084FC' : '#7C3AED'} />
              <Text style={[s.headerBadgeText, { color: isDark ? '#C084FC' : '#7C3AED' }]}>
                Knowledge & Ideas
              </Text>
            </View>
          </View>
          <Text style={[s.title, { color: theme.text.primary }]}>Notes & Docs</Text>
          <Text style={[s.subtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
            Capture thoughts, ideas & meeting minutes
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/notes/new');
          }}
          style={s.addBtnContainer}
          activeOpacity={0.85}
          accessibilityLabel="Add New Note"
        >
          <LinearGradient
            colors={['#7C3AED', '#8B5CF6', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.addBtnGradient}
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />
            <Text style={s.addBtnText}>New Note</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ============================================================== */}
      {/* 2. UNIVERSAL OMNI-BOX (AI FAST NOTE DRAFTING)                  */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInUp.duration(400).delay(60)} style={s.omniWrap}>
        <OmniCaptureBar
          placeholder="e.g. Note: Project architecture notes and UI ideas..."
          onSuccess={() => refetch()}
        />
      </Animated.View>

      {/* ============================================================== */}
      {/* 3. THREE GLOSSY KPI CARDS                                      */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInUp.duration(400).delay(100)} style={s.kpiRow}>
        {/* Card 1: Total Notes */}
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setFilter('all');
          }}
          activeOpacity={0.8}
          style={[
            s.kpiCard,
            {
              backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
              borderColor: filter === 'all' ? '#8B5CF6' : isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              ...shadows.sm,
            },
          ]}
        >
          <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.20)' : 'rgba(238, 242, 255, 0.95)' }]}>
            <Ionicons name="document-text-outline" size={17} color="#8B5CF6" />
          </View>
          <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{totalCount}</Text>
          <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Total Notes</Text>
        </TouchableOpacity>

        {/* Card 2: Pinned */}
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setFilter('pinned');
          }}
          activeOpacity={0.8}
          style={[
            s.kpiCard,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.88)',
              borderColor: filter === 'pinned' ? '#38BDF8' : isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
              ...shadows.sm,
            },
          ]}
        >
          <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(224, 242, 254, 0.95)' }]}>
            <Ionicons name="pin" size={17} color="#38BDF8" />
          </View>
          <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{pinnedCount}</Text>
          <Text style={[s.kpiLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Pinned</Text>
        </TouchableOpacity>

        {/* Card 3: Favorites */}
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setFilter('favorites');
          }}
          activeOpacity={0.8}
          style={[
            s.kpiCard,
            {
              backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
              borderColor: filter === 'favorites' ? '#EC4899' : isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              ...shadows.sm,
            },
          ]}
        >
          <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.20)' : 'rgba(253, 242, 248, 0.95)' }]}>
            <Ionicons name="heart" size={17} color="#EC4899" />
          </View>
          <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{favCount}</Text>
          <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Favorites</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ============================================================== */}
      {/* 4. SEGMENTED FILTER PILL BAR                                    */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInUp.duration(400).delay(140)} style={s.filterWrap}>
        <View
          style={[
            s.segmentBar,
            {
              backgroundColor: isDark ? 'rgba(10, 36, 56, 0.82)' : 'rgba(226, 232, 240, 0.65)',
              borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
            },
          ]}
        >
          {(
            [
              { k: 'all', l: `All (${totalCount})` },
              { k: 'pinned', l: `Pinned (${pinnedCount})` },
              { k: 'favorites', l: `Favorites (${favCount})` },
            ] as const
          ).map((tab) => {
            const isSelected = filter === tab.k;
            return (
              <TouchableOpacity
                key={tab.k}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(tab.k);
                }}
                activeOpacity={0.8}
                style={[
                  s.segmentBtn,
                  isSelected && [
                    s.segmentBtnActive,
                    {
                      backgroundColor: isDark ? '#7C3AED' : '#FFFFFF',
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
                  {tab.l}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* ============================================================== */}
      {/* 5. NOTES LIST WITH FROSTED GLASS CARDS                         */}
      {/* ============================================================== */}
      {isLoading ? (
        <View style={s.listContent}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : !filtered.length ? (
        <EmptyState
          icon="document-text-outline"
          title={search ? 'No matching notes' : 'No notes yet'}
          description={
            search
              ? 'Try adjusting your search query.'
              : 'Draft thoughts, documents, and checklists with fast capture.'
          }
          actionLabel="+ New Note"
          onAction={() => router.push('/notes/new')}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: n, index }) => {
            const previewText = n.content
              ? n.content.replace(/[#*_~`]/g, '').trim().slice(0, 110)
              : '';

            return (
              <Animated.View entering={FadeInUp.duration(380).delay(index * 40)}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => router.push(`/notes/${n.id}` as never)}
                  style={[
                    s.noteCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)',
                      borderColor: n.pinned
                        ? '#38BDF8'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.10)'
                        : 'rgba(255, 255, 255, 0.90)',
                      ...shadows.sm,
                    },
                  ]}
                >
                  {/* Top Row: Title, Pin, Favorite, Delete */}
                  <View style={s.cardHead}>
                    <View style={s.titleRow}>
                      {n.pinned && (
                        <View style={s.pinnedIconBox}>
                          <Ionicons name="pin" size={13} color="#38BDF8" />
                        </View>
                      )}
                      <Text
                        style={[s.noteTitle, { color: theme.text.primary }]}
                        numberOfLines={1}
                      >
                        {n.title || 'Untitled Note'}
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={s.headActions}>
                      <TouchableOpacity
                        onPress={() => handleTogglePin(n)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={n.pinned ? 'pin' : 'pin-outline'}
                          size={16}
                          color={n.pinned ? '#38BDF8' : isDark ? '#94A3B8' : '#64748B'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleToggleFavorite(n)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={n.is_favorite ? 'heart' : 'heart-outline'}
                          size={16}
                          color={n.is_favorite ? '#EC4899' : isDark ? '#819BB3' : '#94A3B8'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDelete(n)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={isDark ? '#64748B' : '#94A3B8'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Content Preview */}
                  {previewText.length > 0 && (
                    <Text
                      style={[s.previewText, { color: isDark ? '#819BB3' : '#64748B' }]}
                      numberOfLines={2}
                    >
                      {previewText}
                    </Text>
                  )}

                  {/* Footer Meta Row: Date & Tags */}
                  <View style={s.cardFooter}>
                    <Text style={[s.dateText, { color: isDark ? '#819BB3' : '#94A3B8' }]}>
                      {format(new Date(n.updated_at), 'MMM d, yyyy')}
                    </Text>

                    <View style={s.tagsRow}>
                      {(n.tags ?? []).slice(0, 3).map((t) => (
                        <View
                          key={t}
                          style={[
                            s.tagChip,
                            {
                              backgroundColor: isDark
                                ? 'rgba(168, 85, 247, 0.16)'
                                : 'rgba(124, 58, 237, 0.08)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              s.tagText,
                              { color: isDark ? '#C084FC' : '#7C3AED' },
                            ]}
                          >
                            #{t}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}
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
  subtitle: { fontSize: fontSize.xs, marginTop: 2, fontWeight: fontWeight.medium },
  addBtnContainer: { borderRadius: radius.full, overflow: 'hidden', ...shadows.sm },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
  },
  addBtnText: { color: '#FFFFFF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  omniWrap: { paddingHorizontal: spacing[5], marginTop: spacing[2] },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing[5],
    marginTop: spacing[3],
  },
  kpiCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.2,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiNumber: { fontSize: 17, fontWeight: fontWeight.bold, letterSpacing: -0.3 },
  kpiLabel: { fontSize: 10, fontWeight: fontWeight.medium, marginTop: 1 },
  filterWrap: { paddingHorizontal: spacing[5], marginTop: spacing[3] },
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
  listContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: 130, // Safe clearance for floating navigation dock
    gap: spacing[3],
  },
  noteCard: {
    borderRadius: 22,
    padding: spacing[4],
    borderWidth: 1.2,
    gap: 8,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  pinnedIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewText: {
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
  dateText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tagText: {
    fontSize: 9,
    fontWeight: fontWeight.semibold,
  },
});
