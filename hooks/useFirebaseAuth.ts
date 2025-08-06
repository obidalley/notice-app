import { auth } from '@/config/firebase';
import { FirebaseService } from '@/services/FirebaseService';
import { User } from '@/types';
import { createUserWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';

export function useFirebaseAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(true);

    // Handle user state changes
    const onAuthStateChangedCallback = useCallback(async (firebaseUser: any | null) => {
        if (firebaseUser) {
            // Get user data from Firebase Database
            let userData = await FirebaseService.getUser(firebaseUser.uid);

            if (!userData) {
                // Create user in database if doesn't exist
                userData = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    photoURL: firebaseUser.photoURL || undefined,
                    location: firebaseUser.location || undefined,
                    createdAt: new Date().toISOString(),
                };

                await FirebaseService.createUser(userData);
            }

            setUser(userData);
        } else {
            setUser(null);
        }

        if (initializing) {
            setInitializing(false);
        }
        setLoading(false);
    }, [initializing]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, onAuthStateChangedCallback);
        return () => unsubscribe(); // unsubscribe on unmount
    }, [onAuthStateChangedCallback]);

    const signIn = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error: any) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.message || 'Sign in failed'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const signUp = useCallback(async (
        email: string,
        password: string,
        displayName: string,
        location?: {
            latitude: number;
            longitude: number;
            address: string;
        },
        photoURL?: string
    ) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Update display name and photoURL
            await updateFirebaseProfile(firebaseUser, {
                displayName,
                photoURL: photoURL || null
            });

            // Create user in database with location
            const userData: User = {
                id: firebaseUser.uid,
                email,
                displayName,
                photoURL: photoURL || undefined,
                location: location || undefined,
                createdAt: new Date().toISOString(),
            };

            await FirebaseService.createUser(userData);

            return { success: true };
        } catch (error: any) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: error.message || 'Sign up failed'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            return { success: true };
        } catch (error: any) {
            console.error('Google sign in error:', error);
            return {
                success: false,
                error: error.message || 'Google sign in failed'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await firebaseSignOut(auth);
            return { success: true };
        } catch (error: any) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: error.message || 'Sign out failed'
            };
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error: any) {
            console.error('Reset password error:', error);
            return {
                success: false,
                error: error.message || 'Password reset failed'
            };
        }
    }, []);

    const updateProfile = useCallback(async (updates: {
        displayName?: string;
        photoURL?: string;
        location?: {
            latitude: number;
            longitude: number;
            address: string;
        }
    }) => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                await updateFirebaseProfile(currentUser, {
                    displayName: updates.displayName,
                    photoURL: updates.photoURL
                });

                // Update in Firebase Database
                if (user) {
                    await FirebaseService.updateUser(user.id, {
                        displayName: updates.displayName || user.displayName,
                        photoURL: updates.photoURL || user.photoURL,
                        location: updates.location || user.location,
                    });
                }
                return { success: true };
            }
            throw new Error('No authenticated user');
        } catch (error: any) {
            console.error('Update profile error:', error);
            return {
                success: false,
                error: error.message || 'Profile update failed'
            };
        }
    }, [user]);

    return {
        user,
        loading,
        initializing,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile,
    };
}