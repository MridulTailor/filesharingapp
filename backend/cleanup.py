import os
import time
from datetime import datetime
from sqlmodel import Session, select
from database import engine
from models import File

def cleanup_expired_files():
    with Session(engine) as session:
        statement = select(File).where(File.expires_at < datetime.utcnow())
        expired_files = session.exec(statement).all()
        
        for file in expired_files:
            print(f"Deleting expired file: {file.filename}")
            try:
                if os.path.exists(file.path):
                    os.remove(file.path)
                session.delete(file)
            except Exception as e:
                print(f"Error deleting file {file.filename}: {e}")
        
        session.commit()

if __name__ == "__main__":
    print("Starting cleanup service...")
    while True:
        cleanup_expired_files()
        time.sleep(60) # Run every minute
