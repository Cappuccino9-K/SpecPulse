from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    CompareRequest,
    CompareResponse,
    ExtractRequest,
    HardwareAnalysisResult,
    HistoryItem,
    Preset,
)
from app.services.analysis_service import (
    compare_products,
    delete_history,
    extract_product,
    get_history,
    list_history,
    resolve_provider,
)
from app.services.crawler_service import AnalysisError
from app.services.fixtures import PRESETS, demo_url

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    from app.config import get_settings

    return {"status": "ok", "provider": get_settings().llm_provider}


@router.get("/presets", response_model=list[Preset])
async def presets() -> list[Preset]:
    return [
        Preset(
            id=item["id"],
            label=item["label"],
            category=item["category"],
            urls=[demo_url(slug) for slug in item["slugs"]],
        )
        for item in PRESETS
    ]


@router.post("/extract", response_model=HardwareAnalysisResult)
async def extract(body: ExtractRequest) -> HardwareAnalysisResult:
    provider = resolve_provider(body.provider)
    try:
        from app.services.analysis_service import assert_provider_ready

        await assert_provider_ready(provider)
        return await extract_product(str(body.url), provider)
    except AnalysisError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.message) from exc


@router.post("/compare", response_model=CompareResponse)
async def compare(body: CompareRequest) -> CompareResponse:
    provider = resolve_provider(body.provider)
    try:
        return await compare_products([str(url) for url in body.urls], provider)
    except AnalysisError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.message) from exc


@router.get("/history", response_model=list[HistoryItem])
async def history(limit: int = Query(default=20, ge=1, le=50)) -> list[HistoryItem]:
    try:
        return await list_history(limit)
    except AnalysisError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.message) from exc


@router.get("/history/{comparison_id}", response_model=CompareResponse)
async def history_detail(comparison_id: UUID) -> CompareResponse:
    try:
        return await get_history(comparison_id)
    except AnalysisError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.message) from exc


@router.delete("/history/{comparison_id}", status_code=204)
async def history_delete(comparison_id: UUID) -> None:
    try:
        await delete_history(comparison_id)
    except AnalysisError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.message) from exc
