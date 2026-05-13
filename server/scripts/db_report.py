import sqlite3
import os
import json

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB = os.path.join(BASE, 'db.sqlite3')

def safe(val):
    try:
        return val
    except Exception:
        return str(val)

if not os.path.exists(DB):
    print(f"ERROR: database not found at {DB}")
    raise SystemExit(1)

conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# get tables
cur.execute("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name")
tables = [r['name'] for r in cur.fetchall()]

report = {'db_path': DB, 'tables': []}

for t in tables:
    info = {'table': t}
    try:
        # columns
        cur.execute(f"PRAGMA table_info('{t}')")
        cols = [dict(c) for c in cur.fetchall()]
        info['columns'] = cols
        # count
        cur.execute(f"SELECT COUNT(*) as c FROM '{t}'")
        info['count'] = cur.fetchone()['c']
        # sample rows
        cur.execute(f"SELECT * FROM '{t}' LIMIT 5")
        rows = [dict(r) for r in cur.fetchall()]
        info['samples'] = rows
    except Exception as e:
        info['error'] = str(e)
    report['tables'].append(info)

print(json.dumps(report, indent=2, ensure_ascii=False))
