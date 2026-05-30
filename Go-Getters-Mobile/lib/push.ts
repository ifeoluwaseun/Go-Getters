import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync(userId: string) {
  if (!userId) return null;

  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00d8fe',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notifications (Permissions rejected).');
      return null;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        'dfa4a6e5-2fa6-49be-8231-6c73cebc696e';

      const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
      token = tokenRes.data;
    } catch (err) {
      console.error('Failed to retrieve Expo Push Token:', err);
    }
  } else {
    console.log('Skipping push token registration: Must use physical device for native push notifications.');
  }

  if (token) {
    try {
      // Check if this token is already stored in the DB
      const { data: existing } = await supabase
        .from('expo_push_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('token', token);

      if (!existing || existing.length === 0) {
        // Insert new token entry in DB
        const { error } = await supabase.from('expo_push_tokens').insert({
          user_id: userId,
          token: token,
        });
        if (error) {
          console.error('Failed to save push token to Supabase:', error);
        } else {
          console.log('Successfully registered and saved mobile push token to Supabase.');
        }
      }
    } catch (dbErr) {
      console.error('Error inserting push token into database:', dbErr);
    }
  }

  return token;
}
