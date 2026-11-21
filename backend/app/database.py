import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL support:
# If DATABASE_URL environment variable is provided (e.g. postgresql://user:pass@localhost:5432/order_to_audit)
# it uses PostgreSQL. Otherwise, defaults to SQLite for immediate zero-config execution.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./order_to_audit.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
