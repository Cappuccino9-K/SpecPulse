import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse, urlunparse

from sqlalchemy.exc import SQLAlchemyError

from app.config import Provider, get_settings
from app.database import SessionLocal
from app.models import ExtractionCacheRow
from app.schemas import HardwareAnalysisResult

logger = logging.getLogger(__name__)

_memory: dict[str, tuple[datetime, dict]] = {}


def cache_key(url: str, provider: Provider) -> str:
    parsed = urlparse(url)
    normalized = urlunparse(parsed._replace(fragment="")).rstrip("/")
    return f"{provider}:{normalized}"


async def get_cached(url: str, provider: Provider) -> HardwareAnalysisResult | None:
    key = cache_key(url, provider)
    now = datetime.now(timezone.utc)
    cached = _memory.get(key)
    if cached and cached[0] > now:
        return _hydrate(cached[1])
    try:
        async with SessionLocal() as session:
            row = await session.get(ExtractionCacheRow, key)
            if row is None or row.expires_at <= now:
                return None
            _memory[key] = (row.expires_at, row.payload)
            return _hydrate(row.payload)
    except SQLAlchemyError:
        logger.exception("failed to read extraction cache")
        return None


async def put_cached(url: str, provider: Provider, result: HardwareAnalysisResult) -> None:
    key = cache_key(url, provider)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(seconds=get_settings().cache_ttl_seconds)
    payload = result.model_dump(mode="json")
    payload["cached"] = False
    _memory[key] = (expires, payload)
    try:
        async with SessionLocal() as session:
            row = await session.get(ExtractionCacheRow, key)
            if row is None:
                row = ExtractionCacheRow(
                    cache_key=key,
                    url=url,
                    provider=provider,
                    payload=payload,
                    fetched_at=now,
                    expires_at=expires,
                )
                session.add(row)
            else:
                row.payload = payload
                row.fetched_at = now
                row.expires_at = expires
            await session.commit()
    except SQLAlchemyError:
        logger.exception("failed to write extraction cache")


def _hydrate(payload: dict) -> HardwareAnalysisResult:
    data = dict(payload)
    data["cached"] = True
    return HardwareAnalysisResult.model_validate(data)
