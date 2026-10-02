from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.models import Base

def _postgres_url(url: str) -> str:
    if url.startswith("sqlite"):
        raise RuntimeError("SpecPulse는 PostgreSQL만 사용합니다.")
    if url.startswith("postgresql+psycopg://"):
        return "postgresql+pg8000://" + url.removeprefix("postgresql+psycopg://")
    if url.startswith("postgres://"):
        return "postgresql+pg8000://" + url.removeprefix("postgres://")
    if url.startswith("postgresql://"):
        return "postgresql+pg8000://" + url.removeprefix("postgresql://")
    return url


settings = get_settings()
engine = create_engine(_postgres_url(settings.database_url), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, class_=Session)


def init_db() -> None:
    Base.metadata.create_all(engine)


def shutdown_db() -> None:
    engine.dispose()
