import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { Platform } from "react-native";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Print diagnostic information about Firebase config
console.log("🔥 Firebase Configuration Diagnostics:");
console.log(`- Project ID: ${firebaseConfig.projectId || '❌ MISSING'}`);
console.log(`- Storage Bucket: ${firebaseConfig.storageBucket || '❌ MISSING'}`);
console.log(`- API Key: ${firebaseConfig.apiKey ? '✅ Set' : '❌ MISSING'}`);
console.log(`- Auth Domain: ${firebaseConfig.authDomain || '❌ MISSING'}`);

// Check for critical missing configuration
if (!firebaseConfig.projectId || !firebaseConfig.storageBucket) {
  console.error("⚠️ WARNING: Critical Firebase configuration is missing! Storage operations will fail.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Storage and test it
const storage = getStorage(app);
console.log(`🔥 Firebase Storage initialized with bucket: ${storage.app.options.storageBucket || 'undefined'}`);

// Configure persistence based on platform
if (Platform.OS === 'web') {
  // For web, set browser persistence
  setPersistence(auth, browserLocalPersistence)
    .catch(error => {
      console.error("Error setting auth persistence:", error);
    });
} else {
  // For React Native, we handle persistence in AuthContext
  console.log("🔄 Using AuthContext for React Native persistence");
}

// Firestore
const db = getFirestore(app);

// Initialize Analytics (conditionally)
const initAnalytics = async (): Promise<Analytics | null> => {
  try {
    if (Platform.OS === 'web' && await isSupported()) {
      return getAnalytics(app);
    }
    return null;
  } catch (e) {
    console.log("Analytics not supported in this environment:", e);
    return null;
  }
};

// Initialize analytics
const analytics: Promise<Analytics | null> = initAnalytics();

// Export all required services
export { auth, db, analytics, storage };