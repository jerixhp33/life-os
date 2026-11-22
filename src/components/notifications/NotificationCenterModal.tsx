import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useTheme } from '../../theme/ThemeContext';
import {
  useNotificationStore,
  LifeNotification,
  NotificationType,
} from '../../stores/notificationStore';
import { fontSize, fontWeight, radius, shadows, spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

type FilterCategory = 'all' | 'tasks' | 'habits' | 'intelligence';

export function NotificationCenterModal({ visible, onClose }: NotificationCenterModalProps) {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const [filter, setFilter] = useState<FilterCategory>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'tasks') return n.type === 'task' || n.type === 'meeting';
    if (filter === 'habits') return n.type === 'habit';
    if (filter === 'intelligence') return n.type === 'intelligence' || n.type === 'system';
    return true;
  });

  const getTypeIcon = (type: NotificationType): { icon: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'meeting':
        return { icon: 'calendar', color: '#6366F1' };
      case 'task':
        return { icon: 'checkbox', color: '#38BDF8' };
      case 'habit':
        return { icon: 'flame', color: '#F59E0B' };
      case 'intelligence':
        return { icon: 'sparkles', color: '#A855F7' };
      case 'system':
      default:
        return { icon: 'notifications', color: '#10B981' };
    }
  };

  const handleActionClick = (notif: LifeNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAsRead(notif.id);
    if (notif.actionRoute) {
      onClose();
      router.push(notif.actionRoute as never);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 85 : 55}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            s.modalCard,
            {
              backgroundColor: isDark ? 'rgba(10, 36, 56, 0.96)' : 'rgba(255, 255, 255, 0.97)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.1)',
            },
          ]}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerTitleRow}>
              <Text style={[s.title, { color: theme.text.primary }]}>Inbox & Alerts</Text>
              {unreadCount > 0 && (
                <View style={s.unreadBadge}>
                  <Text style={s.unreadBadgeText}>{unreadCount} new</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
              style={s.closeBtn}
            >
              <Ionicons name="close" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Controls Bar: Mark all as read & Clear */}
          <View style={s.controlsBar}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                markAllAsRead();
              }}
              disabled={unreadCount === 0}
              style={[s.controlBtn, { opacity: unreadCount === 0 ? 0.4 : 1 }]}
            >
              <Ionicons name="checkmark-done" size={14} color="#38BDF8" />
              <Text style={[s.controlBtnText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                Mark all read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                clearAll();
              }}
              disabled={notifications.length === 0}
              style={[s.controlBtn, { opacity: notifications.length === 0 ? 0.4 : 1 }]}
            >
              <Ionicons name="trash-outline" size={14} color={isDark ? '#819BB3' : '#64748B'} />
              <Text style={[s.controlBtnText, { color: isDark ? '#819BB3' : '#64748B' }]}>
                Clear all
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter Chips */}
          <View style={s.filtersRow}>
            {(['all', 'tasks', 'habits', 'intelligence'] as FilterCategory[]).map((cat) => {
              const active = filter === cat;
              const label =
                cat === 'all'
                  ? 'All'
                  : cat === 'tasks'
                  ? 'Tasks & Calls'
                  : cat === 'habits'
                  ? 'Habits'
                  : 'AI & Insights';
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFilter(cat);
                  }}
                  style={[
                    s.filterChip,
                    active && {
                      backgroundColor: isDark
                        ? 'rgba(56, 189, 248, 0.22)'
                        : 'rgba(2, 132, 199, 0.14)',
                      borderColor: isDark ? '#38BDF8' : '#0284C7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.filterChipText,
                      {
                        color: active
                          ? isDark
                            ? '#38BDF8'
                            : '#0284C7'
                          : isDark
                          ? '#819BB3'
                          : '#64748B',
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notifications Scroll List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
          >
            {filteredNotifications.length === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons
                  name="notifications-off-outline"
                  size={42}
                  color={isDark ? '#819BB3' : '#94A3B8'}
                />
                <Text style={[s.emptyTitle, { color: theme.text.primary }]}>
                  All Caught Up!
                </Text>
                <Text style={[s.emptySubtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  No active alerts in this category right now.
                </Text>
              </View>
            ) : (
              filteredNotifications.map((notif) => {
                const iconInfo = getTypeIcon(notif.type);
                let timeAgo = '';
                try {
                  timeAgo = formatDistanceToNow(parseISO(notif.createdAt), { addSuffix: true });
                } catch {
                  timeAgo = 'Recently';
                }

                return (
                  <View
                    key={notif.id}
                    style={[
                      s.itemCard,
                      {
                        backgroundColor: notif.read
                          ? isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(15, 23, 42, 0.03)'
                          : isDark
                          ? 'rgba(56, 189, 248, 0.12)'
                          : 'rgba(2, 132, 199, 0.08)',
                        borderColor: notif.read
                          ? isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(15, 23, 42, 0.06)'
                          : isDark
                          ? 'rgba(56, 189, 248, 0.3)'
                          : 'rgba(2, 132, 199, 0.25)',
                      },
                    ]}
                  >
                    <View style={s.itemTopRow}>
                      <View
                        style={[
                          s.itemIconSquircle,
                          { backgroundColor: `${iconInfo.color}25` },
                        ]}
                      >
                        <Ionicons name={iconInfo.icon} size={16} color={iconInfo.color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={s.itemHeaderRow}>
                          <Text
                            style={[
                              s.itemTitle,
                              {
                                color: theme.text.primary,
                                fontWeight: notif.read ? '600' : '800',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {notif.title}
                          </Text>
                          {!notif.read && <View style={s.dotGlow} />}
                        </View>
                        <Text style={[s.itemTime, { color: isDark ? '#819BB3' : '#64748B' }]}>
                          {timeAgo}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          deleteNotification(notif.id);
                        }}
                        style={s.dismissBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={18}
                          color={isDark ? '#819BB3' : '#94A3B8'}
                        />
                      </TouchableOpacity>
                    </View>

                    <Text
                      style={[
                        s.itemBody,
                        { color: isDark ? '#CBD5E1' : '#334155' },
                      ]}
                    >
                      {notif.body}
                    </Text>

                    {/* Action Button if present */}
                    {notif.actionLabel && (
                      <TouchableOpacity
                        onPress={() => handleActionClick(notif)}
                        style={[
                          s.actionPill,
                          {
                            backgroundColor: isDark
                              ? 'rgba(56, 189, 248, 0.2)'
                              : 'rgba(2, 132, 199, 0.12)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.actionPillText,
                            { color: isDark ? '#38BDF8' : '#0284C7' },
                          ]}
                        >
                          {notif.actionLabel}
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color={isDark ? '#38BDF8' : '#0284C7'}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '82%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  unreadBadge: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 11,
  },
  listContent: {
    paddingBottom: 40,
    gap: 10,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 220,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemIconSquircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 13,
    flex: 1,
  },
  dotGlow: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#38BDF8',
  },
  itemTime: {
    fontSize: 10,
    marginTop: 1,
  },
  dismissBtn: {
    padding: 2,
  },
  itemBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 2,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
