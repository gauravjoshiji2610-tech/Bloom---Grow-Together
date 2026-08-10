import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDotE7bMbOlYTTI_VHnEqBKrOUEijD20oc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'habitsync-ba9b3.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'habitsync-ba9b3',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'habitsync-ba9b3.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '201202924500',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:201202924500:web:c6c331ff0b8e9286953441',
};

// Initialize Firebase App (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence (best-effort, silently ignored if already enabled or not supported)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser');
  }
});
