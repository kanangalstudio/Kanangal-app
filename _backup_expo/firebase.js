import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDxKYK02bFqgChVsKEKNeWPrpEDYL6oxe0",
  authDomain: "kanangal.firebaseapp.com",
  projectId: "kanangal",
  storageBucket: "kanangal.firebasestorage.app",
  messagingSenderId: "882267028011",
  appId: "1:882267028011:web:ddfd62f2fcfa6f9b88486e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
