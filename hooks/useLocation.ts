import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

interface LocationData {
    latitude: number;
    longitude: number;
    address: string;
}

export function useLocation() {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            setLoading(true);
            setError(null);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Location permission not granted');
                return;
            }

            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const address = await Location.reverseGeocodeAsync({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });

            const formattedAddress = address[0]
                ? `${address[0].street || ''} ${address[0].city || ''}, ${address[0].region || ''}`
                : 'Unknown location';

            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                address: formattedAddress.trim(),
            });
        } catch (err) {
            setError('Failed to get location');
            console.error('Location error:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        location,
        loading,
        error,
        refreshLocation: getCurrentLocation,
    };
}