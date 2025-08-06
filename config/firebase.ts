import { getApps, initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

/* import { getApps, initializeApp } from '@react-native-firebase/app';
import { initializeAuth } from '@react-native-firebase/auth';
import { getDatabase } from '@react-native-firebase/database';
import { getStorage } from '@react-native-firebase/storage'; */

// Your Firebase config - Replace with your actual Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyCtmfjaiZ1SHvJdK_HW-o48schocD6YlXU",
    authDomain: "tutorial-aa29d.firebaseapp.com",
    databaseURL: "https://tutorial-aa29d-default-rtdb.firebaseio.com",
    projectId: "tutorial-aa29d",
    storageBucket: "tutorial-aa29d.appspot.com",
    messagingSenderId: "131802422324",
    appId: "1:131802422324:web:d843cd692f6be7e075fe61",
    measurementId: "G-JY0QB1WHQ7"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Initialize Firebase Auth
export const auth = initializeAuth(app);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;