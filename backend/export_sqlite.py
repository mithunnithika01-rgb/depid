import sqlite3
import json
import os

DB_PATH = 'did.db'
OUTPUT_PATH = 'db_dump.json'

def export_db():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    tables = ['users', 'brand_profiles', 'scan_results', 'scan_jobs', 'public_reports']
    data = {}

    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            data[table] = [dict(row) for row in rows]
        except Exception as e:
            print(f"Skipping table {table}: {e}")

    with open(OUTPUT_PATH, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Successfully exported {DB_PATH} to {OUTPUT_PATH}")

if __name__ == '__main__':
    export_db()
