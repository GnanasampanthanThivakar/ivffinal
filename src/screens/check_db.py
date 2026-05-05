import sqlite3

conn = sqlite3.connect("appdata.sqlite3")
cur = conn.cursor()

print("Tables:")

cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(cur.fetchall())

print("\nDaily Metrics Data:")
cur.execute("SELECT * FROM daily_metrics")
print(cur.fetchall())

print("\nAlerts Data:")
cur.execute("SELECT * FROM alerts")
print(cur.fetchall())

conn.close()