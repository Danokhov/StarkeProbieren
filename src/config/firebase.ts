import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initFirebase = (): Firestore | null => {
  // Проверяем, что все необходимые переменные окружения установлены
  const configCheck = {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    storageBucket: !!firebaseConfig.storageBucket,
    messagingSenderId: !!firebaseConfig.messagingSenderId,
    appId: !!firebaseConfig.appId
  };
  
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('⚠️ Firebase config is not complete. Progress will be saved locally only.');
    console.warn('Firebase config check:', configCheck);
    console.warn('Missing variables:', {
      apiKey: !firebaseConfig.apiKey ? 'VITE_FIREBASE_API_KEY' : '',
      projectId: !firebaseConfig.projectId ? 'VITE_FIREBASE_PROJECT_ID' : ''
    });
    return null;
  }

  try {
    // Инициализируем Firebase только если он еще не инициализирован
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      console.log('✅ Firebase initialized successfully');
      console.log('Firebase config:', {
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey?.substring(0, 20) + '...'
      });
    } else {
      app = getApps()[0];
      db = getFirestore(app);
      console.log('✅ Firebase already initialized');
    }
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return null;
  }
};

export const getFirestoreDb = (): Firestore | null => {
  if (!db) {
    return initFirebase();
  }
  return db;
};

