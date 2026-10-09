import { useState } from 'react';
import { getFirebaseServices } from '../utils/firebase';

export default function MigrationTool() {
  const [status, setStatus] = useState('Idle');
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, msg]);
    console.log(msg);
  };

  const startMigration = async () => {
    setStatus('Migrating...');
    setLogs([]);
    try {
      addLog('Fetching db_dump.json...');
      const res = await fetch('/db_dump.json');
      if (!res.ok) throw new Error('Could not find db_dump.json');
      const data = await res.json();
      
      const fb = await getFirebaseServices();
      if (!fb) throw new Error('Firebase not initialized');
      const { db, collection, setDoc, doc } = fb;

      // Users
      if (data.users) {
        addLog(`Found ${data.users.length} users. Migrating...`);
        for (const u of data.users) {
          const userDoc = {
            username: u.username,
            email: u.email,
            password: u.password_hash, // sqlite password field
            role: u.role,
            permissions: u.permissions
          };
          await setDoc(doc(db, 'users', u.username), userDoc);
        }
        addLog('Users migration complete.');
      }

      // Brand Profiles
      if (data.brand_profiles) {
        const currentUser = JSON.parse(localStorage.getItem('did_user')) || { username: 'admin' };
        addLog(`Found ${data.brand_profiles.length} brand profiles. Migrating...`);
        for (const b of data.brand_profiles) {
          await setDoc(doc(db, 'brands', b.id.toString()), { ...b, owner: currentUser.username });
        }
        addLog('Brands migration complete.');
      }

      // Threats / Scan Results
      if (data.scan_results) {
        addLog(`Found ${data.scan_results.length} scan results. Migrating to threats collection...`);
        for (const r of data.scan_results) {
          const threatDoc = {
            id: r.id.toString(),
            type: r.scan_type || 'UNKNOWN',
            platform: r.platform || 'Web',
            url: r.item_url || '',
            status: r.status || 'ACTIVE',
            riskLevel: r.threat_level || 'UNKNOWN',
            confidence: r.confidence_score || 0,
            ai_reasoning: r.ai_reason || '',
            created_at: r.scanned_at || new Date().toISOString()
          };
          await setDoc(doc(db, 'threats', r.id.toString()), threatDoc);
        }
        addLog('Threats migration complete.');
      }

      setStatus('Migration Successful!');
      addLog('Done.');
    } catch (err) {
      console.error(err);
      setStatus('Migration Failed.');
      addLog(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '40px', background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <h1>SQL to Firebase Migration Tool</h1>
      <button onClick={startMigration} style={{ padding: '12px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
        Start Migration
      </button>
      <div style={{ marginTop: '20px', fontWeight: 'bold' }}>Status: {status}</div>
      <div style={{ marginTop: '20px', background: 'black', color: 'lime', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', minHeight: '300px' }}>
        {logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </div>
  );
}
