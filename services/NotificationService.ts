import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export class NotificationService {
    static async initialize(): Promise<string | null> {
        try {
            // Request permission
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return null;
            }

            // Get Expo push token
            const token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Expo Push Token:', token);

            return token;
        } catch (error) {
            console.error('Error initializing notifications:', error);
            return null;
        }
    }

    static async sendLocalNotification(title: string, body: string, data?: any) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: 'default',
                },
                trigger: null, // Send immediately
            });
        } catch (error) {
            console.error('Error sending local notification:', error);
        }
    }

    static async sendNoticeNotification(notice: any, userLocation?: { latitude: number; longitude: number }) {
        try {
            let title = '';
            let body = '';

            switch (notice.type) {
                case 'emergency':
                    title = '🚨 EMERGENCY ALERT';
                    body = notice.title;
                    break;
                case 'alert':
                    title = '⚠️ Community Alert';
                    body = notice.title;
                    break;
                case 'event':
                    title = '📅 Community Event';
                    body = notice.title;
                    break;
                default:
                    title = '📢 Community News';
                    body = notice.title;
            }

            await this.sendLocalNotification(title, body, {
                type: 'notice',
                noticeId: notice.id,
                priority: notice.priority,
            });
        } catch (error) {
            console.error('Error sending notice notification:', error);
        }
    }

    static async sendChatNotification(message: any, roomName: string) {
        try {
            await this.sendLocalNotification(
                roomName,
                `${message.senderName}: ${message.text || 'Sent an image'}`,
                {
                    type: 'chat',
                    roomId: message.roomId,
                    messageId: message.id,
                }
            );
        } catch (error) {
            console.error('Error sending chat notification:', error);
        }
    }

    static async setupBackgroundMessageHandler() {
        // Expo handles background notifications natively via expo-notifications
        console.log('Background notification handling managed by expo-notifications');
        // Additional setup can be added if needed for specific background tasks
    }

    static onNotificationReceived(callback: (notification: any) => void) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    static onNotificationResponse(callback: (response: any) => void) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }
}