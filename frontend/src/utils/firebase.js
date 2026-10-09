import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACP7dPKEvhYRf7om4pGVo5CHSGeRiOc3M",
  authDomain: "defenc-id.firebaseapp.com",
  projectId: "defenc-id",
  storageBucket: "defenc-id.firebasestorage.app",
  messagingSenderId: "890030827771",
  appId: "1:890030827771:web:cf06631834bad185cce85e",
  measurementId: "G-C2959ZDPWE"
};

// Initialize Firebase
let app = null;
let analytics = null;

try {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined") {
    isSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(err => console.warn("Firebase analytics not supported:", err));
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

export { app, analytics, firebaseConfig };
