from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# This file establishes the connection to MySQL
# using PyMYSQL and creates a session factory
PASSWORD = quote_plus(settings.DB_PASSWORD)

# connection string
DATABASE_URL = f"mysql+pymysql://{settings.DB_USER}:{PASSWORD}@{settings.DB_HOST}/{settings.DB_NAME}"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Checks if connection is still alive
    pool_recycle=True,  # recycle old connections so MySQL does not kill them
    echo=True  # Print SQL queries in terminal
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine  # connects session factory to the engine
)
