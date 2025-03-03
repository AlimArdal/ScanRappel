import { auth, db, analytics } from './firebaseConfig';
import openai from './openai';
import { Analytics } from 'firebase/analytics';

// Function to test if Firebase is properly configured
export const testFirebaseConfig = async () => {
  console.log('Firebase auth initialized:', !!auth);
  console.log('Firebase Firestore initialized:', !!db);
  
  // Since analytics is a Promise<Analytics | null>, we need to handle it properly
  const analyticsInstance: Analytics | null = await analytics;
  console.log('Firebase analytics initialized:', !!analyticsInstance);
  
  // Return true if Firebase is properly configured
  return !!auth && !!db;
};

// Function to test if OpenAI is properly configured
export const testOpenAIConfig = () => {
  console.log('OpenAI API key is set:', !!process.env.EXPO_PUBLIC_OPENAI_API_KEY);
  console.log('OpenAI client initialized:', !!openai);
  
  // Return true if OpenAI is properly configured
  return !!process.env.EXPO_PUBLIC_OPENAI_API_KEY && !!openai;
};

// Export both test functions
export { auth, db, analytics, openai }; 