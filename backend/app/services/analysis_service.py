import asyncio
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.config import Provider, get_settings
from app.database import SessionLocal
from app.models import ComparisonRow
from app.schemas import CompareResponse, HardwareAnalysisResult, HistoryItem
from app.services.cache_service import get_cached, put_cached
from app.services.compare_service import build_spec_rows, guide_to_summary, local_guide
from app.services.crawler_service import AnalysisError, fetch_html, try_crawl4ai
from app.services.fixtures import demo_slug, load_fixture
from app.services.llm_service import LlmError, guide_with_llm, structure_with_llm
from app.services.parser import html_to_markdown, parse_hardware
from app.services.url_safety import UrlSafetyError, validate_public_url

logger = logging.getLogger(__name__)


def resolve_provider(provider: Provider | None) -> Provider:
    return provider or get_settings().llm_provider


async def assert_provider_ready(provider: Provider) -> None:
    settings = get_settings()
    if provider == "openai" and not settings.openai_api_key:
        raise AnalysisError(
            "OPENAI_API_KEY가 없습니다. 키를 설정하거나 로컬 엔진을 선택해 주세요.",
            400,
        )
    if provider == "ollama":
        import httpx

        try:
            async with httpx.AsyncClient(timeout=3) as client:
                response = await client.get(f"{settings.ollama_base_url.rstrip('/')}/api/tags")
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise AnalysisError(
                "Ollama에 연결하지 못했습니다. 서버를 실행하거나 로컬 엔진을 선택해 주세요.",
                400,
            ) from exc


async def extract_product(url: str, provider: Provider) -> HardwareAnalysisResult:
    try:
        validate_public_url(url)
    except UrlSafetyError as exc:
        raise AnalysisError(str(exc), 400) from exc
    cached = await get_cached(url, provider)
    if cached is not None:
        return cached
    result = await _extract_fresh(url, provider)
    await put_cached(url, provider, result)
    return result


async def compare_products(urls: list[str], provider: Provider) -> CompareResponse:
    await assert_provider_ready(provider)
    products = await asyncio.gather(*(extract_product(url, provider) for url in urls))
    if provider == "local":
        guide = local_guide(list(products))
    else:
        guide = await guide_with_llm(list(products), provider)
    created = datetime.now(timezone.utc)
    response = CompareResponse(
        products=list(products),
        summary=guide_to_summary(guide),
        guide=guide,
        spec_rows=build_spec_rows(list(products)),
        provider=provider,
        created_at=created,
    )
    return await _save_comparison(urls, response)


async def list_history(limit: int = 20) -> list[HistoryItem]:
    try:
        async with SessionLocal() as session:
            stmt = select(ComparisonRow).order_by(ComparisonRow.created_at.desc()).limit(limit)
            rows = (await session.scalars(stmt)).all()
    except SQLAlchemyError as exc:
        logger.exception("history list failed")
        raise AnalysisError("비교 기록을 읽지 못했습니다.", 503) from exc
    return [
        HistoryItem(
            id=row.id,
            title=row.title,
            urls=list(row.urls),
            provider=row.provider,  # type: ignore[arg-type]
            created_at=row.created_at,
        )
        for row in rows
    ]


async def get_history(comparison_id: uuid.UUID) -> CompareResponse:
    row = await _get_row(comparison_id)
    return CompareResponse.model_validate(row.payload)


async def delete_history(comparison_id: uuid.UUID) -> None:
    try:
        async with SessionLocal() as session:
            row = await session.get(ComparisonRow, comparison_id)
            if row is None:
                raise AnalysisError("비교 기록을 찾지 못했습니다.", 404)
            await session.delete(row)
            await session.commit()
    except AnalysisError:
        raise
    except SQLAlchemyError as exc:
        logger.exception("history delete failed")
        raise AnalysisError("비교 기록을 지우지 못했습니다.", 503) from exc


async def _extract_fresh(url: str, provider: Provider) -> HardwareAnalysisResult:
    slug = demo_slug(url)
    if slug:
        html = load_fixture(slug)
        if html is None:
            raise AnalysisError("데모 제품을 찾지 못했습니다.", 404)
        return await _from_html(html, url, provider, allow_crawl=False)

    if provider != "local":
        crawled = await try_crawl4ai(url, provider)
        if crawled is not None:
            return crawled
    html = await fetch_html(url)
    return await _from_html(html, url, provider, allow_crawl=False)


async def _from_html(html: str, url: str, provider: Provider, allow_crawl: bool) -> HardwareAnalysisResult:
    del allow_crawl
    if provider == "local":
        try:
            return parse_hardware(html, url)
        except ValueError as exc:
            raise AnalysisError(str(exc), 422) from exc
    try:
        return await structure_with_llm(html_to_markdown(html), url, provider)
    except LlmError as exc:
        raise AnalysisError(str(exc), 502) from exc


async def _save_comparison(urls: list[str], response: CompareResponse) -> CompareResponse:
    names = [product.spec.name for product in response.products]
    title = " vs ".join(names)
    row_id = uuid.uuid4()
    created = response.created_at or datetime.now(timezone.utc)
    stored = response.model_copy(update={"id": row_id, "created_at": created})
    try:
        async with SessionLocal() as session:
            session.add(
                ComparisonRow(
                    id=row_id,
                    title=title[:400],
                    urls=urls,
                    provider=response.provider,
                    payload=stored.model_dump(mode="json"),
                    created_at=created,
                )
            )
            await session.commit()
    except SQLAlchemyError:
        logger.exception("failed to save comparison")
        return response
    return stored


async def _get_row(comparison_id: uuid.UUID) -> ComparisonRow:
    try:
        async with SessionLocal() as session:
            row = await session.get(ComparisonRow, comparison_id)
    except SQLAlchemyError as exc:
        logger.exception("history read failed")
        raise AnalysisError("비교 기록을 읽지 못했습니다.", 503) from exc
    if row is None:
        raise AnalysisError("비교 기록을 찾지 못했습니다.", 404)
    return row
