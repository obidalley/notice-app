import AuthScreen from '@/components/AuthScreen';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { NotificationService } from '@/services/NotificationService';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  useFrameworkReady();
  const { user, initializing } = useFirebaseAuth();
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
      await NotificationService.setupBackgroundMessageHandler();
      setNotificationsInitialized(true);

      // Set up notification listeners
      const notificationListener = NotificationService.onNotificationReceived((notification) => {
        console.log('Notification received:', notification);
      });

      const responseListener = NotificationService.onNotificationResponse((response) => {
        console.log('Notification response:', response);
        // Handle notification tap - navigate to relevant screen
      });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  if (initializing) {
    return null; // Show loading screen or splash
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}