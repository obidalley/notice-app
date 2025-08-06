import * as Location from 'expo-location';

export class LocationService {
    static async getCurrentLocation(): Promise<Location.LocationObject | null> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Location permission not granted');
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            return location;
        } catch (error) {
            console.error('Error getting current location:', error);
            return null;
        }
    }

    static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
        try {
            const result = await Location.reverseGeocodeAsync({ latitude, longitude });

            if (result.length > 0) {
                const address = result[0];
                return `${address.street || ''} ${address.city || ''}, ${address.region || ''}`.trim();
            }

            return 'Unknown location';
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            return 'Unknown location';
        }
    }

    static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static async isLocationWithinRadius(
        centerLat: number,
        centerLon: number,
        targetLat: number,
        targetLon: number,
        radiusKm: number
    ): Promise<boolean> {
        const distance = this.calculateDistance(centerLat, centerLon, targetLat, targetLon);
        return distance <= radiusKm;
    }
}