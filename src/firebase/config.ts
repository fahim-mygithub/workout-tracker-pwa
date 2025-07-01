import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCh2sOBBYE7MEwZHn56C-U-05YPJeu1Bts",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "workout-pwa-nf0sf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "workout-pwa-nf0sf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "workout-pwa-nf0sf.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "279571661113",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:279571661113:web:60a6afd092fa7b1832a8e8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;