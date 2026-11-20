export const setNotificationHandler=jest.fn();
export const getPermissionsAsync=jest.fn().mockResolvedValue({status:'granted'});
export const requestPermissionsAsync=jest.fn().mockResolvedValue({status:'granted'});
export const scheduleNotificationAsync=jest.fn().mockResolvedValue('mock-id');
export const cancelScheduledNotificationAsync=jest.fn().mockResolvedValue(undefined);
export const cancelAllScheduledNotificationsAsync=jest.fn().mockResolvedValue(undefined);
export const setBadgeCountAsync=jest.fn().mockResolvedValue(undefined);
export const SchedulableTriggerInputTypes={ DATE:'date' };
