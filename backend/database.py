import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, Time, create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/hcp_crm")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    specialty = Column(String(255))
    institution = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id", ondelete="SET NULL"), nullable=True)
    hcp_name = Column(String(255))
    interaction_type = Column(String(50), default="Meeting")
    interaction_date = Column(Date)
    interaction_time = Column(Time)
    attendees = Column(Text)
    topics_discussed = Column(Text)
    materials_shared = Column(Text)
    samples_distributed = Column(Text)
    sentiment = Column(String(20), default="Neutral")
    outcomes = Column(Text)
    followup_actions = Column(Text)
    ai_suggested_followups = Column(Text)
    raw_chat_input = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id", ondelete="CASCADE"), nullable=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)


class UserActivity(Base):
    __tablename__ = "user_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(255), nullable=False)
    route = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    interaction_columns = {column["name"] for column in inspector.get_columns("interactions")}
    if "user_id" not in interaction_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE interactions ADD COLUMN user_id INT NULL AFTER id"))
    db = SessionLocal()
    try:
        seed_hcps = [
            ("Dr. Smith", "Oncology", "City Medical Center"),
            ("Dr. Patel", "Cardiology", "Apollo Hospital"),
            ("Dr. Johnson", "Neurology", "National Brain Institute"),
            ("Dr. Williams", "Endocrinology", "Metro Clinic"),
            ("Dr. Brown", "Pulmonology", "Chest & Lung Hospital"),
        ]
        for name, specialty, institution in seed_hcps:
            exists = db.query(HCP).filter(HCP.name == name).first()
            if exists:
                exists.specialty = specialty
                exists.institution = institution
            else:
                db.add(HCP(name=name, specialty=specialty, institution=institution))
        db.commit()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
