import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

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
        console.log("[Firebase] Analytics initialized successfully with G-C2959ZDPWE");
      }
    }).catch(err => console.warn("[Firebase] Analytics support check:", err));
  }
} catch (error) {
  console.error("[Firebase] Initialization error:", error);
}

export { app, analytics, firebaseConfig };
