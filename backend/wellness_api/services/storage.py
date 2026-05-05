import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

DB_PATH = Path(__file__).resolve().parents[1] / "appdata.sqlite3"


def get_conn():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db() -> None:
    con = get_conn()
    cur = con.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS daily_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        date_iso TEXT NOT NULL,
        hr REAL,
        hrv REAL,
        sleep REAL,
        steps REAL,
        stress_level TEXT,
        activity_suggested TEXT,
        confidence REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_user_date ON daily_metrics(user_id, date_iso)")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        date_iso TEXT NOT NULL,
        from_level TEXT,
        to_level TEXT,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_alerts_user_date ON alerts(user_id, date_iso)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_alerts_user_read ON alerts(user_id, is_read)")

    con.commit()
    con.close()


def upsert_day(payload: Dict[str, Any]) -> None:
    con = get_conn()
    cur = con.cursor()

    cur.execute(
        "DELETE FROM daily_metrics WHERE user_id=? AND date_iso=?",
        (payload["user_id"], payload["date_iso"])
    )

    cur.execute("""
      INSERT INTO daily_metrics (
        user_id, date_iso, hr, hrv, sleep, steps,
        stress_level, activity_suggested, confidence
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payload["user_id"],
        payload["date_iso"],
        payload.get("hr"),
        payload.get("hrv"),
        payload.get("sleep"),
        payload.get("steps"),
        payload.get("stress_level"),
        payload.get("activity_suggested"),
        payload.get("confidence"),
    ))

    con.commit()
    con.close()


def _empty_day(date_iso: str) -> Dict[str, Any]:
    return {
        "date_iso": date_iso,
        "hr": 0.0,
        "hrv": 0.0,
        "sleep": 0.0,
        "steps": 0.0,
        "stress_level": "Unknown",
    }


def get_last_n_days(user_id: str, n: int = 7) -> List[Dict[str, Any]]:
    con = get_conn()
    cur = con.cursor()

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=n - 1)

    cur.execute("""
      SELECT user_id, date_iso, hr, hrv, sleep, steps, stress_level
      FROM daily_metrics
      WHERE user_id=? AND date_iso BETWEEN ? AND ?
      ORDER BY date_iso ASC
    """, (user_id, start_date.isoformat(), end_date.isoformat()))

    rows = [dict(r) for r in cur.fetchall()]
    con.close()

    rows_by_date = {r["date_iso"]: r for r in rows}

    output: List[Dict[str, Any]] = []
    for i in range(n):
        d = start_date + timedelta(days=i)
        date_iso = d.isoformat()
        output.append(rows_by_date.get(date_iso, _empty_day(date_iso)))

    return output


def get_previous_stress_level(user_id: str, before_date_iso: Optional[str] = None) -> Optional[str]:
    con = get_conn()
    cur = con.cursor()

    if before_date_iso:
        cur.execute("""
            SELECT stress_level
            FROM daily_metrics
            WHERE user_id=? AND date_iso < ?
            ORDER BY date_iso DESC, id DESC
            LIMIT 1
        """, (user_id, before_date_iso))
    else:
        cur.execute("""
            SELECT stress_level
            FROM daily_metrics
            WHERE user_id=?
            ORDER BY date_iso DESC, id DESC
            LIMIT 1
        """, (user_id,))

    row = cur.fetchone()
    con.close()

    if not row:
        return None

    level = row["stress_level"]
    if not level:
        return None

    return str(level).strip()


def insert_alert(user_id: str, date_iso: str, from_level: str, to_level: str, message: str) -> bool:
    con = get_conn()
    cur = con.cursor()

    cur.execute("""
      SELECT id
      FROM alerts
      WHERE user_id=? AND date_iso=? AND from_level=? AND to_level=? AND message=?
      LIMIT 1
    """, (user_id, date_iso, from_level, to_level, message))

    exists = cur.fetchone()
    if exists:
        con.close()
        return False

    cur.execute("""
      INSERT INTO alerts (user_id, date_iso, from_level, to_level, message, is_read)
      VALUES (?, ?, ?, ?, ?, 0)
    """, (user_id, date_iso, from_level, to_level, message))

    con.commit()
    con.close()
    return True


def get_alerts(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    con = get_conn()
    cur = con.cursor()

    cur.execute("""
      SELECT id, user_id, date_iso, from_level, to_level, message, is_read, created_at
      FROM alerts
      WHERE user_id=?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ?
    """, (user_id, limit))

    rows = [dict(r) for r in cur.fetchall()]
    con.close()
    return rows


def get_unread_count(user_id: str) -> int:
    con = get_conn()
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) AS cnt FROM alerts WHERE user_id=? AND is_read=0", (user_id,))
    row = cur.fetchone()
    con.close()
    return int(row["cnt"] if row else 0)


def mark_alerts_read(user_id: str) -> None:
    con = get_conn()
    cur = con.cursor()
    cur.execute("UPDATE alerts SET is_read=1 WHERE user_id=? AND is_read=0", (user_id,))
    con.commit()
    con.close()