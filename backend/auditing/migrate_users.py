import sqlite3
import os

def run_migration():
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    db_path = os.path.join(backend_dir, 'data', 'sonar_x.db')
    if not os.path.exists(db_path):
        # Database will be created on app startup
        print(f"Database {db_path} does not exist yet. It will be initialized on startup.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if cursor.fetchone():
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "verification_expiry" not in columns:
            print("Adding verification_expiry to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN verification_expiry DATETIME")
        
        if "verification_attempts" not in columns:
            print("Adding verification_attempts to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN verification_attempts INTEGER DEFAULT 0")
            
        if "verification_last_sent" not in columns:
            print("Adding verification_last_sent to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN verification_last_sent DATETIME")
            
        conn.commit()
        print("Users migration completed.")
    else:
        print("Users table does not exist yet. It will be created via Base.metadata.create_all.")

    conn.close()

if __name__ == "__main__":
    run_migration()
