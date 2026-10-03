import logging
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session, sessionmaker

logger = logging.getLogger(__name__)

from app.config import get_settings
from app.models import Base

PREVIEW_SQL = Path(__file__).resolve().parent.parent / "sql" / "preview_all_tables.sql"

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
    statement = PREVIEW_SQL.read_text(encoding="utf-8")
    try:
        with engine.begin() as connection:
            connection.execute(text(statement))
    except ProgrammingError:
        logger.warning("preview_all_tables 함수를 만들지 못했습니다. 데이터베이스 소유자 계정으로 다시 실행하면 생성됩니다.")


def shutdown_db() -> None:
    engine.dispose()
