/**
 * Centralized configuration for environment variables.
 * Vite injects import.meta.env at build time.
 */

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Ensure required env vars are present
function getEnvVar(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
};
