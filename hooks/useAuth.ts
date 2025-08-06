import { auth } from '@/config/firebase';
import { User } from '@/types';
import { createUserWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    // Monitor auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const mappedUser: User = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                };
                setUser(mappedUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            const mappedUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || email.split('@')[0],
                createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            };
            setUser(mappedUser);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Sign in failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string, displayName: string) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            const mappedUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: displayName || email.split('@')[0],
                createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            };
            setUser(mappedUser);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Sign up failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const firebaseUser = userCredential.user;
            const mappedUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            };
            setUser(mappedUser);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Google Sign-In failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Sign out failed' };
        }
    }, []);

    const checkAuthState = useCallback(async () => {
        setLoading(true);
        try {
            const firebaseUser = auth.currentUser;
            if (firebaseUser) {
                const mappedUser: User = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                };
                setUser(mappedUser);
            } else {
                setUser(null);
            }
        } catch (error: any) {
            console.error('Error checking auth state:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        checkAuthState,
    };
}