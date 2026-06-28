import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Read Cloudflare proxy domain from localStorage if set by user
const storedProxy = typeof window !== 'undefined' ? localStorage.getItem('firebase_auth_proxy') : null;
const CUSTOM_AUTH_DOMAIN = storedProxy || ""; 

const appConfig = {
  ...firebaseConfig,
  authDomain: CUSTOM_AUTH_DOMAIN || firebaseConfig.authDomain
};

export const app = initializeApp(appConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
