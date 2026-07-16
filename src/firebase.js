import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCuDfgD2sr6cen2rpCWnSE-RruEYUmLXUQ",
  authDomain: "king-of-predictions-17019.firebaseapp.com",
  databaseURL: "https://king-of-predictions-17019-default-rtdb.firebaseio.com",
  projectId: "king-of-predictions-17019",
  storageBucket: "king-of-predictions-17019.firebasestorage.app",
  messagingSenderId: "966950889316",
  appId: "1:966950889316:web:ce7f538f630624c3e83c71",
  measurementId: "G-52MK1ER6QW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function getFirebaseMessaging() {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}

export { getToken, onMessage, auth, googleProvider };
