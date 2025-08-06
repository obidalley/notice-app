import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { LocationService } from '@/services/LocationService';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Camera, Eye, EyeOff, Lock, Mail, MapPin, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
    const { signIn, signUp, signInWithGoogle, loading } = useFirebaseAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
        address: string;
    } | null>(null);

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
                aspect: [1, 1],
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
                aspect: [1, 1],
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

    const showImageOptions = () => {
        Alert.alert(
            'Select Profile Picture',
            'Choose an option:',
            [
                { text: 'Camera', onPress: handleCamera },
                { text: 'Photo Library', onPress: handleImagePicker },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
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

    const handleEmailAuth = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (!isLogin && !displayName.trim()) {
            Alert.alert('Error', 'Please enter your display name');
            return;
        }

        if (!isLogin && !location) {
            Alert.alert('Error', 'Please select a location');
            return;
        }

        const result = isLogin
            ? await signIn(email, password)
            : await signUp(email, password, displayName, location || undefined, selectedImage?.uri);

        if (!result.success) {
            Alert.alert('Error', result.error || 'Authentication failed');
        }
    };

    const handleGoogleSignIn = async () => {
        const result = await signInWithGoogle();
        if (!result.success) {
            Alert.alert('Error', result.error || 'Google sign in failed');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
            >
                <KeyboardAvoidingView
                    style={styles.keyboardAvoid}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.headerContainer}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logo}>
                                    <Text style={styles.logoText}>GC</Text>
                                </View>
                            </View>
                            <Text style={styles.title}>Global Community</Text>
                            <Text style={styles.subtitle}>
                                Connect with your community through location-based notices
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity
                                    style={[styles.tab, isLogin && styles.activeTab]}
                                    onPress={() => setIsLogin(true)}
                                >
                                    <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                                        Sign In
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, !isLogin && styles.activeTab]}
                                    onPress={() => setIsLogin(false)}
                                >
                                    <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                                        Sign Up
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {!isLogin && (
                                <>
                                    <View style={styles.inputContainer}>
                                        <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Display Name"
                                            placeholderTextColor="#9CA3AF"
                                            value={displayName}
                                            onChangeText={setDisplayName}
                                            autoCapitalize="words"
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <MapPin size={20} color="#9CA3AF" style={styles.inputIcon} />
                                        <TouchableOpacity style={styles.locationButton} onPress={handleLocationSelection}>
                                            <Text style={styles.locationButtonText}>
                                                {location ? location.address : 'Select Location'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Camera size={20} color="#9CA3AF" style={styles.inputIcon} />
                                        {selectedImage ? (
                                            <View style={styles.imageContainer}>
                                                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                                                <TouchableOpacity
                                                    style={styles.removeImageButton}
                                                    onPress={() => setSelectedImage(null)}
                                                >
                                                    <Text style={styles.removeImageText}>X</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity style={styles.imageButton} onPress={showImageOptions}>
                                                <Text style={styles.imageButtonText}>Add Profile Picture</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </>
                            )}

                            <View style={styles.inputContainer}>
                                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Email Address"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Password"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.authButton, loading && styles.authButtonDisabled]}
                                onPress={handleEmailAuth}
                                disabled={loading}
                            >
                                <Text style={styles.authButtonText}>
                                    {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.googleButton}
                                onPress={handleGoogleSignIn}
                                disabled={loading}
                            >
                                <Image
                                    source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                                    style={styles.googleIcon}
                                />
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 32,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#2563EB',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        paddingVertical: 16,
    },
    eyeIcon: {
        padding: 4,
    },
    locationButton: {
        flex: 1,
        paddingVertical: 16,
    },
    locationButtonText: {
        fontSize: 16,
        color: '#111827',
    },
    imageButton: {
        flex: 1,
        paddingVertical: 16,
    },
    imageButtonText: {
        fontSize: 16,
        color: '#2563EB',
        fontWeight: '600',
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
        marginVertical: 8,
    },
    selectedImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginVertical: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeImageText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    authButton: {
        backgroundColor: '#2563EB',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    authButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0.1,
    },
    authButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 14,
        color: '#9CA3AF',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
});