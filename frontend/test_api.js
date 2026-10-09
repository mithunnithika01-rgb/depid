import { scanApi } from './src/utils/api.js';

async function test() {
  const start = await scanApi.start("brand_123", ["google_search"]);
  console.log("Start:", start);
  
  // mock localstorage
  global.localStorage = {
    store: {},
    getItem: (key) => global.localStorage.store[key],
    setItem: (key, val) => { global.localStorage.store[key] = val; },
    removeItem: (key) => { delete global.localStorage.store[key]; }
  };
  global.localStorage.setItem(start.job_id, JSON.stringify({ start: Date.now() - 6000, platforms: ["google_search"], brandId: "brand_123" }));
  
  // mock firebase
  global.window = {}; // required for some firestore stuff? 
  // actually api.js expects window.firebase to exist? 
  // Let's just simulate the bug in api.js 
}

test();
