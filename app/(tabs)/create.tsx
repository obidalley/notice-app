import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/FirebaseService';
import { LocationService } from '@/services/LocationService';
import { Notice } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { AlertTriangle, Calendar, Camera, LucideIcon, MapPin, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the type for notice types
type NoticeType = {
    key: 'event' | 'alert' | 'news';
    label: string;
    icon: LucideIcon;
    color: string;
};

const NOTICE_TYPES: NoticeType[] = [
    { key: 'event', label: 'Event', icon: Calendar, color: '#10B981' },
    { key: 'alert', label: 'Alert', icon: AlertTriangle, color: '#F59E0B' },
    { key: 'news', label: 'News', icon: Users, color: '#3B82F6' },
];

export default function CreateScreen() {
    const { user } = useAuth(); // Get user from useAuth hook
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedType, setSelectedType] = useState<'event' | 'alert' | 'news'>('event');
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
        address: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleImagePicker = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera roll permission is needed to select images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to select image.');
        }
    };

    const handleCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Failed to take photo.');
        }
    };

    const handleLocationSelection = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Location permission is needed.');
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            const address = await LocationService.reverseGeocode(
                currentLocation.coords.latitude,
                currentLocation.coords.longitude
            );

            setLocation({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                address: address,
            });
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Failed to get location.');
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert('Authentication Required', 'Please sign in to create a notice.');
            return;
        }

        if (!title.trim() || !description.trim()) {
            Alert.alert('Validation Error', 'Please fill in all required fields.');
            return;
        }

        if (!location) {
            Alert.alert('Location Required', 'Please select a location for your notice.');
            return;
        }

        try {
            setLoading(true);

            let imageUrl = undefined;
            if (selectedImage) {
                imageUrl = await FirebaseService.uploadImage(selectedImage.uri);
            }

            const noticeData: Omit<Notice, 'id' | 'createdAt'> = {
                title: title.trim(),
                description: description.trim(),
                type: selectedType,
                imageUrl,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address,
                },
                authorId: user.id,
                authorName: user.displayName,
                priority: 'medium', // Default priority; adjust as needed
                rsvpList: [],
                comments: [],
                likes: [],
            };

            await FirebaseService.createNotice(noticeData);

            Alert.alert(
                'Success',
                'Your notice has been created successfully!',
                [{ text: 'OK', onPress: resetForm }]
            );
        } catch (error) {
            console.error('Error creating notice:', error);
            Alert.alert('Error', 'Failed to create notice. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSelectedType('event');
        setSelectedImage(null);
        setLocation(null);
    };

    const showImageOptions = () => {
        Alert.alert(
            'Select Image',
            'Choose an option:',
            [
                { text: 'Camera', onPress: handleCamera },
                { text: 'Photo Library', onPress: handleImagePicker },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Create Notice</Text>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notice Type</Text>
                    <View style={styles.typeContainer}>
                        {NOTICE_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.key}
                                style={[
                                    styles.typeButton,
                                    { borderColor: type.color },
                                    selectedType === type.key && { backgroundColor: type.color + '20' },
                                ]}
                                onPress={() => setSelectedType(type.key)}
                            >
                                <type.icon
                                    size={24}
                                    color={selectedType === type.key ? type.color : '#9CA3AF'}
                                />
                                <Text
                                    style={[
                                        styles.typeText,
                                        selectedType === type.key && { color: type.color },
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter notice title..."
                        placeholderTextColor="#9CA3AF"
                        maxLength={100}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe your notice in detail..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{description.length}/500</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location *</Text>
                    <TouchableOpacity style={styles.locationButton} onPress={handleLocationSelection}>
                        <MapPin size={20} color="#3B82F6" />
                        <Text style={styles.locationButtonText}>
                            {location ? location.address : 'Select Location'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Image (Optional)</Text>
                    {selectedImage ? (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setSelectedImage(null)}
                            >
                                <X size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.imageButton} onPress={showImageOptions}>
                            <Camera size={24} color="#3B82F6" />
                            <Text style={styles.imageButtonText}>Add Image</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Creating...' : 'Create Notice'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
    },
    form: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: '#FFFFFF',
        gap: 8,
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        height: 120,
    },
    charCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    locationButtonText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    imageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        gap: 12,
    },
    imageButtonText: {
        fontSize: 16,
        color: '#3B82F6',
        fontWeight: '600',
    },
    imageContainer: {
        position: 'relative',
    },
    selectedImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#EF4444',
        borderRadius: 16,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});