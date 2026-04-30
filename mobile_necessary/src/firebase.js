// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// Copy .env.example → .env and fill in your Firebase credentials.
// Until then the app renders in "demo mode" (auth calls are no-ops).
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
} from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// ── Demo guard: skip Firebase init if keys are missing ────────────────────────
const isDemoMode = !apiKey || apiKey === 'your_api_key_here';

let auth, googleProvider, facebookProvider, appleProvider;

if (isDemoMode) {
  console.warn(
    '[EarthyCo] Firebase credentials not found.\n' +
    'Copy .env.example → .env and add your Firebase config to enable auth.\n' +
    'Running in demo mode — sign-in buttons will show a toast instead.'
  );
  // Export stubs so imports don't break
  auth             = null;
  googleProvider   = null;
  facebookProvider = null;
  appleProvider    = null;
} else {
  const firebaseConfig = {
    apiKey,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');

  facebookProvider = new FacebookAuthProvider();
  facebookProvider.addScope('email');

  appleProvider = new OAuthProvider('apple.com');
  appleProvider.addScope('email');
  appleProvider.addScope('name');
}

export { auth, googleProvider, facebookProvider, appleProvider, isDemoMode };
