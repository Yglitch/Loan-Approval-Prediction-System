from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv
import os

# load .env file
load_dotenv()

# read database URL from .env
DB_CONNECTION = os.getenv("DB_CONNECTION")

# create engine — connects python to postgresql
engine = create_engine(DB_CONNECTION)

# create session — used to talk to database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# base class — all database models will inherit from this
Base = declarative_base()

# dependency — used in FastAPI routes to get database session

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()