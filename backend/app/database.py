from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.models import Base

settings = get_settings()
if settings.database_url.startswith("sqlite"):
    raise RuntimeError("SpecPulse는 PostgreSQL만 사용합니다. DATABASE_URL을 postgresql+psycopg:// 로 설정하세요.")

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, class_=Session)


def init_db() -> None:
    Base.metadata.create_all(engine)


def shutdown_db() -> None:
    engine.dispose()
