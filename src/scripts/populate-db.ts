import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { createUsers } from '../lib/db-service';
import { Timestamp } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const initialUsers = [
  {
    name: 'Papa',
    role: 'admin' as const,
    points: 0,
    avatar: '👨',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    name: 'Mama',
    role: 'child' as const,
    points: 0,
    avatar: '👩',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    name: 'Emma',
    role: 'child' as const,
    points: 0,
    avatar: '👧',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    name: 'Mia',
    role: 'child' as const,
    points: 0,
    avatar: '👧',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

async function populateDatabase() {
  try {
    console.log('Creating users...');
    const users = await createUsers(initialUsers);
    console.log('Successfully created users:', users);
    process.exit(0);
  } catch (error) {
    console.error('Error populating database:', error);
    process.exit(1);
  }
}

populateDatabase(); 