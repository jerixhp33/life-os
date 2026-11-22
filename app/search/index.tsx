import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/theme/ThemeContext';
import { fontSize, fontWeight, radius, shadows, spacing } from '../../src/theme/tokens';
import { useTasks } from '../../src/features/tasks/hooks';
import { useNotes } from '../../src/features/notes/hooks';
import { useEvents } from '../../src/features/calendar/hooks';
import { useHabits } from '../../src/features/habits/hooks';
import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyTransactions } from '../../src/features/finance/api';
import { useAuthStore } from '../../src/stores/authStore';
import { AppBackground } from '../../src/components/layout/AppBackground';
import { Card } from '../../src/components/ui/Card';

type SearchCategory = 'all' | 'tasks' | 'notes' | 'finance' | 'calendar' | 'habits';

interface SearchResultItem {
  id: string;
  type: 'task' | 'note' | 'finance' | 'calendar' | 'habit';
  title: string;
  subtitle: string;
  badge?: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

const CATEGORIES: Array<{ key: SearchCategory; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'all', label: 'All', icon: 'sparkles' },
  { key: 'tasks', label: 'Tasks', icon: 'checkbox-outline' },
  { key: 'notes', label: 'Notes', icon: 'document-text-outline' },
  { key: 'finance', label: 'Finance', icon: 'wallet-outline' },
  { key: 'calendar', label: 'Events', icon: 'calendar-outline' },
  { key: 'habits', label: 'Habits', icon: 'repeat-outline' },
];

export default function SpotlightSearchScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.id);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');

  // Fetch real data
  const { data: tasks } = useTasks();
  const { data: notes } = useNotes();
  const fromDate = useMemo(() => new Date(Date.now() - 30 * 86400000).toISOString(), []);
  const toDate = useMemo(() => new Date(Date.now() + 60 * 86400000).toISOString(), []);
  const { data: events } = useEvents(fromDate, toDate);
  const { data: habits } = useHabits();
  const { data: transactions } = useQuery({
    queryKey: ['transactions', uid, 0],
    queryFn: () => fetchMonthlyTransactions(uid!, 0),
    enabled: Boolean(uid),
  });

  // Aggregate and filter results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: SearchResultItem[] = [];

    // 1. Tasks
    if (activeCategory === 'all' || activeCategory === 'tasks') {
      (tasks ?? []).forEach((t) => {
        if (!q || t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))) {
          list.push({
            id: `task-${t.id}`,
            type: 'task',
            title: t.title,
            subtitle: t.due_date ? `Due ${t.due_date} · Priority: ${t.priority}` : `Priority: ${t.priority}`,
            badge: t.status === 'completed' ? 'Completed' : t.priority.toUpperCase(),
            route: `/tasks/${t.id}`,
            icon: 'checkbox-outline',
            gradient: ['#0284C7', '#38BDF8'],
          });
        }
      });
    }

    // 2. Notes
    if (activeCategory === 'all' || activeCategory === 'notes') {
      (notes ?? []).forEach((n) => {
        if (!q || n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q))) {
          list.push({
            id: `note-${n.id}`,
            type: 'note',
            title: n.title,
            subtitle: n.content ? n.content.slice(0, 60).replace(/\n/g, ' ') : 'No description',
            badge: n.pinned ? 'PINNED' : undefined,
            route: `/notes/${n.id}`,
            icon: 'document-text-outline',
            gradient: ['#7C3AED', '#A855F7'],
          });
        }
      });
    }

    // 3. Transactions
    if (activeCategory === 'all' || activeCategory === 'finance') {
      (transactions ?? []).forEach((tr) => {
        const desc = tr.description || 'Transaction';
        if (!q || desc.toLowerCase().includes(q) || tr.category.toLowerCase().includes(q)) {
          list.push({
            id: `tx-${tr.id}`,
            type: 'finance',
            title: desc,
            subtitle: `${tr.category} · ${tr.date}`,
            badge: tr.type === 'expense' ? `-Rs ${tr.amount}` : `+Rs ${tr.amount}`,
            route: '/finance',
            icon: 'wallet-outline',
            gradient: ['#D97706', '#F59E0B'],
          });
        }
      });
    }

    // 4. Calendar Events
    if (activeCategory === 'all' || activeCategory === 'calendar') {
      (events ?? []).forEach((ev) => {
        if (!q || ev.title.toLowerCase().includes(q) || (ev.description && ev.description.toLowerCase().includes(q))) {
          list.push({
            id: `event-${ev.id}`,
            type: 'calendar',
            title: ev.title,
            subtitle: ev.location ? `${ev.location} · ${ev.start_at.slice(0, 10)}` : ev.start_at.slice(0, 10),
            badge: 'EVENT',
            route: `/calendar/${ev.id}`,
            icon: 'calendar-outline',
            gradient: ['#E11D48', '#FB7185'],
          });
        }
      });
    }

    // 5. Habits
    if (activeCategory === 'all' || activeCategory === 'habits') {
      (habits ?? []).forEach((h) => {
        if (!q || h.title.toLowerCase().includes(q)) {
          list.push({
            id: `habit-${h.id}`,
            type: 'habit',
            title: h.title,
            subtitle: `${h.frequency.toUpperCase()} · Target: ${h.target_count}x daily`,
            badge: 'HABIT',
            route: `/habits/${h.id}`,
            icon: 'repeat-outline',
            gradient: ['#059669', '#10B981'],
          });
        }
      });
    }

    return list;
  }, [query, activeCategory, tasks, notes, transactions, events, habits]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? '#060B13' : '#F8FAFC' }]}
      edges={['top', 'left', 'right']}
    >
      <AppBackground screenName="home" />

      {/* Top Search Input Bar */}
      <View style={styles.header}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.22)'
                : 'rgba(15, 23, 42, 0.08)',
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={isDark ? '#38BDF8' : '#0284C7'}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tasks, notes, finance, events..."
            placeholderTextColor={isDark ? '#819BB3' : '#94A3B8'}
            style={[styles.input, { color: theme.text.primary }]}
            autoFocus
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? '#819BB3' : '#94A3B8'}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.cancelBtn}
        >
          <Text style={[styles.cancelText, { color: theme.brand.primary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoriesRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(cat.key);
                }}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? theme.brand.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(15, 23, 42, 0.05)',
                    borderColor: isSelected
                      ? theme.brand.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(15, 23, 42, 0.08)',
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon}
                  size={12}
                  color={isSelected ? '#FFFFFF' : theme.text.secondary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.text.primary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Results List */}
      <ScrollView
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.resultCount, { color: isDark ? '#819BB3' : '#64748B' }]}>
          {results.length} {results.length === 1 ? 'match' : 'matches'} found
        </Text>

        {results.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(item.route as any);
            }}
            activeOpacity={0.8}
            style={[
              styles.resultCard,
              {
                backgroundColor: isDark
                  ? 'rgba(10, 36, 56, 0.85)'
                  : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(15, 23, 42, 0.06)',
              },
            ]}
          >
            {/* Specular Hairline */}
            <View
              style={[
                styles.cardSpecular,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(255, 255, 255, 0.95)',
                },
              ]}
            />

            {/* Icon Squircle */}
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconSquircle}
            >
              <Ionicons name={item.icon} size={16} color="#FFFFFF" />
            </LinearGradient>

            {/* Content Text */}
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.itemTitle, { color: theme.text.primary }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.itemSub,
                  { color: isDark ? '#819BB3' : '#64748B' },
                ]}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </View>

            {/* Badge */}
            {item.badge && (
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(56, 189, 248, 0.14)'
                      : 'rgba(2, 132, 199, 0.08)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isDark ? '#38BDF8' : '#0284C7' },
                  ]}
                >
                  {item.badge}
                </Text>
              </View>
            )}

            <Ionicons
              name="chevron-forward"
              size={15}
              color={isDark ? '#64748B' : '#94A3B8'}
            />
          </TouchableOpacity>
        ))}

        {results.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={48}
              color={isDark ? '#334155' : '#CBD5E1'}
            />
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text.primary },
              ]}
            >
              No results found
            </Text>
            <Text
              style={[
                styles.emptySub,
                { color: isDark ? '#819BB3' : '#64748B' },
              ]}
            >
              Try searching with a different keyword or category.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesRow: {
    paddingVertical: 6,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardSpecular: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
  },
  iconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
});
