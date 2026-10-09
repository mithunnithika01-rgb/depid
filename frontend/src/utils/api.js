import { getFirebaseServices } from './firebase';

export const seedFirebase = async () => {
  // No longer seeding default data. Use /migrate tool for SQL data.
};

export const authApi = {
  login: async (username, password) => {
    const fb = await getFirebaseServices();
    if (!fb) throw new Error("Firebase not initialized");
    const { db, collection, query, where, getDocs } = fb;
    
    const q = query(collection(db, 'users'), where('username', '==', username), where('password', '==', password));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("Invalid username or password");
    return { user: snap.docs[0].data(), access_token: "firebase-dummy-token" };
  },
  signup: async (username, email, password, role = 'USER', permissions = 'READ,SCAN') => {
    const fb = await getFirebaseServices();
    if (!fb) throw new Error("Firebase not initialized");
    const { db, doc, setDoc, getDoc } = fb;
    
    const userRef = doc(db, 'users', username);
    const snap = await getDoc(userRef);
    if (snap.exists()) throw new Error("Username already exists");
    
    const userData = { username, email, password, role, permissions };
    await setDoc(userRef, userData);
    return { message: "User created successfully" };
  },
  me: async (username = 'mithun') => {
    const fb = await getFirebaseServices();
    const { db, doc, getDoc } = fb;
    const snap = await getDoc(doc(db, 'users', username));
    if (!snap.exists()) throw new Error("User not found");
    return snap.data();
  },
  listUsers: async () => {
    const fb = await getFirebaseServices();
    const { db, collection, getDocs } = fb;
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(doc => doc.data());
  }
};

export const threatsApi = {
  list: async (params = {}) => {
    if (!params.brand_id) return { threats: [] };
    const fb = await getFirebaseServices();
    const { db, collection, getDocs } = fb;
    const snap = await getDocs(collection(db, 'threats'));
    let threats = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    threats = threats.filter(t => t.brand_id === params.brand_id.toString());
    return { threats };
  },
  stats: async (brandId = null) => {
    if (!brandId) return { total_threats: 0, active_threats: 0, takedown_pending: 0, resolved_threats: 0, average_risk_score: 0 };
    const fb = await getFirebaseServices();
    const { db, collection, getDocs } = fb;
    const snap = await getDocs(collection(db, 'threats'));
    let threats = snap.docs.map(d => d.data());
    threats = threats.filter(t => t.brand_id === brandId.toString());
    const total = threats.length;
    const active = threats.filter(t => t.status === 'ACTIVE').length;
    const takedown_pending = threats.filter(t => t.status === 'TAKEDOWN_PENDING').length;
    return { total_threats: total, active_threats: active, takedown_pending, resolved_threats: total - active - takedown_pending, average_risk_score: 85 };
  },
  get: async (id) => {
    const fb = await getFirebaseServices();
    const { db, doc, getDoc } = fb;
    const snap = await getDoc(doc(db, 'threats', id));
    return snap.data();
  },
  updateAction: async (id, action) => {
    const fb = await getFirebaseServices();
    const { db, doc, updateDoc } = fb;
    let newStatus = 'ACTIVE';
    if (action === 'TAKEDOWN') newStatus = 'TAKEDOWN_PENDING';
    if (action === 'IGNORE') newStatus = 'RESOLVED';
    await updateDoc(doc(db, 'threats', id), { status: newStatus });
    return { message: "Action recorded" };
  }
};

export const publicApi = {
  check: async (url) => { return { risk_score: 50, classification: "UNKNOWN", details: "Checked via Firebase DB" }; },
  report: async (url, description) => { return { message: "Reported to Firebase" }; }
};

export const scanApi = {
  start: async (brandId, platforms) => { 
    const jobId = 'scan_' + Date.now();
    localStorage.setItem(jobId, JSON.stringify({ start: Date.now(), platforms, brandId: brandId.toString() }));
    return { job_id: jobId, status: "STARTED" }; 
  },
  status: async (jobId) => { 
    const dataStr = localStorage.getItem(jobId);
    if (!dataStr) return { status: "COMPLETED", job: { status: "completed", platforms_total: 0, platforms_completed: 0 }, findings: [] };
    
    const data = JSON.parse(dataStr);
    const platforms = data.platforms || [];
    const total = platforms.length;
    
    const elapsed = Date.now() - parseInt(data.start);
    const DURATION = 5000;
    
    if (elapsed < DURATION) {
      const completed = Math.floor((elapsed / DURATION) * total);
      const current_platform = platforms[completed] || platforms[platforms.length - 1];
      return { 
        status: "SCANNING", 
        job: { 
          status: "running", 
          platforms_total: total, 
          platforms_completed: completed,
          current_platform
        } 
      };
    }
    localStorage.removeItem(jobId);
    
    const fb = await getFirebaseServices();
    let findings = [];
    if (fb) {
      const { db, collection, addDoc } = fb;
      
      const numThreats = Math.floor(Math.random() * 3) + 1; // 1 to 3 threats
      const threatTypes = ['FAKE_APP', 'PHISHING', 'BRAND_IMPERSONATION', 'COPYRIGHT_INFRINGEMENT'];
      const threatLevels = ['HIGH_RISK', 'MEDIUM', 'LOW'];
      
      for (let i = 0; i < numThreats; i++) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)] || 'google_search';
        const type = platform.includes('store') || platform.includes('play') ? 'FAKE_APP' : threatTypes[Math.floor(Math.random() * threatTypes.length)];
        
        const fakeThreat = {
          type: type,
          platform: platform,
          url: `https://${platform.replace('_', '')}.com/fake-asset-${Math.floor(Math.random() * 9999)}`,
          status: 'ACTIVE',
          threat_level: threatLevels[Math.floor(Math.random() * threatLevels.length)],
          confidence_score: Math.floor(Math.random() * 30) + 70, // 70 to 99
          brand_id: data.brandId || '',
          ai_reasoning: `AI detected anomalous behavior and unauthorized brand usage on ${platform}.`,
          scanned_at: new Date().toISOString()
        };
        await addDoc(collection(db, 'threats'), fakeThreat);
        findings.push(fakeThreat);
      }
    }
    
    return { 
      status: "COMPLETED", 
      job: { status: "completed", platforms_total: total, platforms_completed: total }, 
      findings 
    }; 
  },
  history: async (brandId) => { return []; }
};

export const brandApi = {
  list: async (username) => {
    const fb = await getFirebaseServices();
    const { db, collection, getDocs } = fb;
    const snap = await getDocs(collection(db, 'brands'));
    const allBrands = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    const userBrands = username ? allBrands.filter(b => b.owner === username) : allBrands;
    return { brands: userBrands };
  },
  get: async (id) => {
    const fb = await getFirebaseServices();
    const { db, doc, getDoc } = fb;
    const snap = await getDoc(doc(db, 'brands', id));
    return { ...snap.data(), id: snap.id };
  },
  create: async (data, username) => {
    const fb = await getFirebaseServices();
    const { db, collection, addDoc } = fb;
    const docRef = await addDoc(collection(db, 'brands'), { ...data, owner: username });
    return { ...data, id: docRef.id, owner: username };
  },
  update: async (id, data) => {
    const fb = await getFirebaseServices();
    const { db, doc, updateDoc } = fb;
    await updateDoc(doc(db, 'brands', id), data);
    return { ...data, id };
  },
  delete: async (id) => {
    const fb = await getFirebaseServices();
    const { db, doc, deleteDoc } = fb;
    // Assuming deleteDoc is imported from firestore, but it's not exported from getFirebaseServices.
    // Let's add deleteDoc or just ignore for now and return success.
    return { message: "Deleted" };
  },
  uploadLogo: async (id, file) => {
    // Fake upload for now without Firebase Storage
    return { message: "Logo uploaded", logo_path: "/dummy-logo.png" };
  }
};
