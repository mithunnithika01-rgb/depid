/**
 * Firebase Web SDK & Firestore Database Utility
 * Project ID: defenc-id
 * Hosting Domain: defenc-id.firebaseapp.com
 */

export const firebaseConfig = {
  apiKey: "AIzaSyACP7dPKEvhYRf7om4pGVo5CHSGeRiOc3M",
  authDomain: "defenc-id.firebaseapp.com",
  projectId: "defenc-id",
  storageBucket: "defenc-id.firebasestorage.app",
  messagingSenderId: "890030827771",
  appId: "1:890030827771:web:cf06631834bad185cce85e",
  measurementId: "G-C2959ZDPWE"
};

// Web initialization helper
export async function getFirebaseServices() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    const { getFirestore, collection, getDocs, addDoc, doc, setDoc, query, where, limit, getDoc, updateDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    let analytics = null;
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      // Analytics measurementId optional
    }

    return {
      app,
      db,
      analytics,
      collection,
      getDocs,
      addDoc,
      doc,
      setDoc,
      query,
      where,
      limit,
      getDoc,
      updateDoc,
      deleteDoc
    };
  } catch (err) {
    console.warn('[Firebase] Fallback to API bridge:', err);
    return null;
  }
}
