import { useNotificationStore } from '../../src/stores/notificationStore';
import { NOTIFICATION_CHANNELS } from '../../src/lib/notifications/scheduler';

describe('LifeOS Notification Store & Scheduler', () => {
  beforeEach(async () => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoaded: true,
    });
  });

  it('defines 4 standard Android notification channels', () => {
    expect(NOTIFICATION_CHANNELS.BRIEFINGS).toBe('briefings');
    expect(NOTIFICATION_CHANNELS.MEETINGS).toBe('meetings');
    expect(NOTIFICATION_CHANNELS.HABITS).toBe('habits');
    expect(NOTIFICATION_CHANNELS.FINANCE).toBe('finance');
  });

  it('adds and reads notifications accurately', async () => {
    await useNotificationStore.getState().addNotification({
      title: 'Board Meeting Prep',
      body: 'Meeting starts in 15 mins.',
      type: 'meeting',
      actionRoute: '/calendar',
      actionLabel: 'Join Meeting',
    });

    const notifs = useNotificationStore.getState().notifications;
    expect(notifs).toHaveLength(1);
    expect(notifs[0].title).toBe('Board Meeting Prep');
    expect(notifs[0].read).toBe(false);
    expect(useNotificationStore.getState().unreadCount).toBe(1);

    // Mark as read
    await useNotificationStore.getState().markAsRead(notifs[0].id);
    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('marks all as read and clears inbox', async () => {
    await useNotificationStore.getState().addNotification({
      title: 'Alert 1',
      body: 'Body 1',
      type: 'task',
    });
    await useNotificationStore.getState().addNotification({
      title: 'Alert 2',
      body: 'Body 2',
      type: 'habit',
    });

    expect(useNotificationStore.getState().unreadCount).toBe(2);

    await useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount).toBe(0);

    await useNotificationStore.getState().clearAll();
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });
});
