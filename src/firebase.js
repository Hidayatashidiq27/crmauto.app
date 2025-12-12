import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Mengambil kunci rahasia dari file .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- PERUBAHAN PENTING ---
// Pastikan ada kata 'export' di depan const app
export const app = initializeApp(firebaseConfig);

// Pastikan ada kata 'export' di depan const db
export const db = getFirestore(app);