"""
Database Migration Script
=========================
Adds columns that exist in the SQLAlchemy ORM models but are missing from
the existing SQLite database because SQLAlchemy's create_all() does NOT
add columns to already-existing tables.

This script is SAFE and IDEMPOTENT:
  - It checks whether each column already exists before ALTER-ing.
  - It does NOT delete or modify any existing data.
  - It does NOT recreate tables.
  - Run it any number of times without side effects.

Usage (from repo root):
    cd backend && source venv/bin/activate
    python scripts/migrate_db.py
"""

import os
import sys
import sqlite3
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("migrate_db")

SCRIPT_DIR  = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DB_PATH     = BACKEND_DIR / "data" / "sonar_x.db"

if not DB_PATH.exists():
    logger.error(f"Database not found at {DB_PATH}")
    sys.exit(1)

logger.info(f"Migrating database: {DB_PATH}")

def existing_columns(cur, table):
    cur.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cur.fetchall()}

MIGRATIONS = [
    # detections
    ("detections", "model_version",           "TEXT"),
    ("detections", "dataset_version",          "TEXT"),
    ("detections", "location_source",          "TEXT"),
    ("detections", "coordinate_uncertainty",   "REAL"),
    # anomalies
    ("anomalies", "model_version",             "TEXT"),
    ("anomalies", "dataset_version",           "TEXT"),
    ("anomalies", "location_source",           "TEXT"),
    ("anomalies", "coordinate_uncertainty",    "REAL"),
    ("anomalies", "sonar_image_path",          "TEXT"),
    ("anomalies", "updated_at",                "DATETIME"),
    # image_processing_jobs
    ("image_processing_jobs", "model_version", "TEXT"),
]

conn = sqlite3.connect(str(DB_PATH))
cur  = conn.cursor()

applied = 0
skipped = 0

for table, column, col_def in MIGRATIONS:
    cols = existing_columns(cur, table)
    if column in cols:
        logger.info(f"  SKIP  {table}.{column}  (already exists)")
        skipped += 1
    else:
        sql = f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"
        logger.info(f"  ADD   {table}.{column}  ({col_def})")
        cur.execute(sql)
        applied += 1

conn.commit()
conn.close()

logger.info(f"\nMigration complete — {applied} column(s) added, {skipped} already present.")
logger.info("Restart the backend server now.")
