import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDirYmKWrzlanDxWzdRmc_8jYEFzEOjuXc',
  authDomain: 'planer-3e65e.firebaseapp.com',
  projectId: 'planer-3e65e',
  storageBucket: 'planer-3e65e.firebasestorage.app',
  messagingSenderId: '992164725600',
  appId: '1:992164725600:web:5f7a713af82451d07e1405',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;

