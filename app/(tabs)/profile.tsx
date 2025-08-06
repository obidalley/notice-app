import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useLocation } from '@/hooks/useLocation';
import { FirebaseService } from '@/services/FirebaseService';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Camera, Globe, CircleHelp as HelpCircle, LogOut, MapPin, Moon, Settings, Shield, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user, signOut, updateProfile } = useFirebaseAuth();
    const { location } = useLocation();
    const [darkMode, setDarkMode] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [locationSharing, setLocationSharing] = useState(true);

    const handleImagePicker = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera roll permission is needed to select images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && user) {
                const imageUrl = await FirebaseService.uploadImage(result.assets[0].uri, 'profiles');
                await updateProfile({ photoURL: imageUrl });
                Alert.alert('Success', 'Profile picture updated successfully!');
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to update profile picture.');
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]
        );
    };

    const settingsOptions = [
        {
            title: 'Push Notifications',
            subtitle: 'Receive alerts and updates',
            icon: Bell,
            value: pushNotifications,
            onToggle: setPushNotifications,
            type: 'toggle',
        },
        {
            title: 'Location Sharing',
            subtitle: 'Share location for relevant notices',
            icon: MapPin,
            value: locationSharing,
            onToggle: setLocationSharing,
            type: 'toggle',
        },
        {
            title: 'Dark Mode',
            subtitle: 'Use dark theme',
            icon: Moon,
            value: darkMode,
            onToggle: setDarkMode,
            type: 'toggle',
        },
        {
            title: 'Privacy Settings',
            subtitle: 'Manage your privacy preferences',
            icon: Shield,
            type: 'action',
            onPress: () => Alert.alert('Privacy Settings', 'Privacy settings coming soon!'),
        },
        {
            title: 'Language',
            subtitle: 'English',
            icon: Globe,
            type: 'action',
            onPress: () => Alert.alert('Language', 'Language settings coming soon!'),
        },
        {
            title: 'Help & Support',
            subtitle: 'Get help and contact support',
            icon: HelpCircle,
            type: 'action',
            onPress: () => Alert.alert('Help & Support', 'Help center coming soon!'),
        },
    ];

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.message}>Please sign in to view profile</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.headerGradient}
                >
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            {user.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <User size={40} color="#FFFFFF" />
                                </View>
                            )}
                            <TouchableOpacity style={styles.cameraButton} onPress={handleImagePicker}>
                                <Camera size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.displayName}>{user.displayName}</Text>
                        <Text style={styles.email}>{user.email}</Text>

                        {location && (
                            <View style={styles.locationContainer}>
                                <MapPin size={14} color="rgba(255, 255, 255, 0.8)" />
                                <Text style={styles.locationText}>{location.address}</Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Notices Created</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Events Attended</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Comments Made</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Settings</Text>
                        {settingsOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.settingItem}
                                onPress={option.onPress}
                                disabled={option.type === 'toggle'}
                            >
                                <View style={styles.settingLeft}>
                                    <View style={styles.settingIcon}>
                                        <option.icon size={20} color="#6B7280" />
                                    </View>
                                    <View style={styles.settingText}>
                                        <Text style={styles.settingTitle}>{option.title}</Text>
                                        <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                                    </View>
                                </View>

                                {option.type === 'toggle' ? (
                                    <Switch
                                        value={option.value}
                                        onValueChange={option.onToggle}
                                        trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                                        thumbColor="#FFFFFF"
                                    />
                                ) : (
                                    <Settings size={16} color="#9CA3AF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <LogOut size={20} color="#DC2626" />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    headerGradient: {
        paddingBottom: 24,
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: 24,
        paddingHorizontal: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarPlaceholder: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    displayName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 12,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 6,
    },
    content: {
        padding: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    signOutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#DC2626',
        marginLeft: 8,
    },
    message: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 40,
    },
});