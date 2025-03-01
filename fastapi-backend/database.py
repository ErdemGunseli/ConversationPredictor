import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base


# Declaring the engine to connect with the DB:
engine = create_engine(os.getenv("DB_URI"), pool_pre_ping=True)

# sessionmaker class is used to create session objects to connect & interact with the DB:
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# declarative_base function is used to create a base class for all data models:
Base = declarative_base()
