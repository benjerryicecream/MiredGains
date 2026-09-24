import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set global handler for notifications received while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  useEffect(() => {
    // Android specific channel setup
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('workout-reminders', {
        name: 'Workout Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: undefined, // default sound
      });
    }
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Failed to request notification permissions', e);
      return false;
    }
  };

  const scheduleWorkoutNotification = async (
    title: string,
    scheduledDate: Date
  ): Promise<string | undefined> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn('Cannot schedule notification without permission.');
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏋️ Workout Reminder!',
          body: `Time for your scheduled workout: "${title}"`,
          data: { title },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledDate,
          channelId: Platform.OS === 'android' ? 'workout-reminders' : undefined,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule workout notification', error);
      return undefined;
    }
  };

  const cancelNotification = async (notificationId?: string) => {
    if (!notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.warn('Failed to cancel notification', notificationId, error);
    }
  };

  return {
    requestPermissions,
    scheduleWorkoutNotification,
    cancelNotification,
  };
}
