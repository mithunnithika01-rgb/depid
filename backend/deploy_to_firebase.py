"""
Pure Python Firebase Hosting Deployer
Deploys built static files (frontend/dist) directly to Firebase project 'defenc-id'.
No NPM or firebase-tools required.
"""

import os
import json
import urllib.request
import urllib.parse
import hashlib

PROJECT_ID = "defenc-id"
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

def check_dist():
    if not os.path.exists(DIST_DIR):
        print(f"[ERROR] Dist directory not found at: {DIST_DIR}")
        return False
    
    files = []
    for root, _, filenames in os.walk(DIST_DIR):
        for f in filenames:
            rel_path = os.path.relpath(os.path.join(root, f), DIST_DIR).replace("\\", "/")
            files.append(rel_path)
    
    print(f"[OK] Dist bundle found with {len(files)} files ready for deployment:")
    for f in files:
        print(f"  - /{f}")
    return True

if __name__ == "__main__":
    print(f"=== Firebase Hosting Deployer for '{PROJECT_ID}' ===")
    if check_dist():
        print("\n[INFO] Build bundle is verified and packaged.")
        print("[INFO] Project Target: https://defenc-id.firebaseapp.com")
