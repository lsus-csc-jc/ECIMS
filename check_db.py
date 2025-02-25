import sqlite3
conn = sqlite3.connect('db.sqlite3')
print(conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall())
