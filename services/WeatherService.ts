import { WEATHER_API_KEY, WEATHER_BASE_URL } from '@/constants';
import { Notice } from '@/types';
import { FirebaseService } from './FirebaseService';
import { NotificationService } from './NotificationService';

export class WeatherService {
    private static readonly API_KEY = WEATHER_API_KEY;
    private static readonly BASE_URL = WEATHER_BASE_URL;

    static async getWeatherAlerts(latitude: number, longitude: number): Promise<any[]> {
        try {
            const response = await fetch(
                `${this.BASE_URL}/onecall?lat=${latitude}&lon=${longitude}&appid=${this.API_KEY}&exclude=minutely,hourly,daily`
            );

            const data = await response.json();
            return data.alerts || [];
        } catch (error) {
            console.error('Error fetching weather alerts:', error);
            return [];
        }
    }

    static async checkWeatherAlerts(userLocation: { latitude: number; longitude: number }, userId: string) {
        try {
            const alerts = await this.getWeatherAlerts(userLocation.latitude, userLocation.longitude);

            for (const alert of alerts) {
                // Create automated notice for weather alert
                const noticeData: Omit<Notice, 'id' | 'createdAt'> = {
                    authorId: 'weather-system',
                    authorName: 'Weather Alert System',
                    type: 'alert',
                    title: `Weather Alert: ${alert.event}`,
                    description: alert.description,
                    location: {
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        address: 'Your Area',
                    },
                    priority: this.getAlertPriority(alert.event),
                    rsvpList: [], // Added to match Notice interface
                    comments: [], // Added to match Notice interface
                    likes: [],    // Added to match Notice interface
                };

                const notice = await FirebaseService.createNotice(noticeData);

                // Send push notification
                await NotificationService.sendNoticeNotification(notice, userLocation);
            }
        } catch (error) {
            console.error('Error checking weather alerts:', error);
        }
    }

    private static getAlertPriority(event: string): 'low' | 'medium' | 'high' | 'emergency' {
        const emergencyEvents = ['tornado', 'hurricane', 'flood', 'wildfire'];
        const highPriorityEvents = ['severe thunderstorm', 'winter storm', 'heat wave'];
        const mediumPriorityEvents = ['rain', 'snow', 'wind'];

        const eventLower = event.toLowerCase();

        if (emergencyEvents.some(e => eventLower.includes(e))) {
            return 'emergency';
        } else if (highPriorityEvents.some(e => eventLower.includes(e))) {
            return 'high';
        } else if (mediumPriorityEvents.some(e => eventLower.includes(e))) {
            return 'medium';
        }

        return 'low';
    }

    static async getWeatherInfo(latitude: number, longitude: number): Promise<any> {
        try {
            const response = await fetch(
                `${this.BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${this.API_KEY}&units=metric`
            );

            return await response.json();
        } catch (error) {
            console.error('Error fetching weather info:', error);
            return null;
        }
    }
}