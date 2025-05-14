import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '../config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Platform-specific initialization
const platform = typeof window !== 'undefined' ? 'web' : 'native';
console.log(`Initializing Firebase for platform: ${platform}`);

// Export platform-specific services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const platformType = platform;