import asyncio
import json
import logging
from urllib.parse import urljoin

import httpx

from app.config import Provider, get_settings
from app.schemas import HardwareAnalysisResult, ProductSpec, ReviewSummary
from app.services.parser import html_to_markdown

logger = logging.getLogger(__name__)

USER_AGENT = "SpecPulseBot/1.0 (hardware spec research; +https://demo.specpulse.app)"


class AnalysisError(Exception):
    def __init__(self, message: str, status: int = 400) -> None:
        self.message = message
        self.status = status
        super().__init__(message)


async def fetch_html(url: str) -> str:
    from app.services.url_safety import UrlSafetyError, validate_public_url

    current = url
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}
    async with httpx.AsyncClient(timeout=20, headers=headers) as client:
        for _ in range(4):
            try:
                validate_public_url(current)
            except UrlSafetyError as exc:
                raise AnalysisError(str(exc), 400) from exc
            try:
                response = await client.get(current, follow_redirects=False)
            except httpx.HTTPError as exc:
                raise AnalysisError("페이지를 열지 못했습니다. 주소와 네트워크를 확인해 주세요.", 422) from exc
            if response.status_code in {301, 302, 303, 307, 308}:
                location = response.headers.get("location")
                if not location:
                    break
                current = urljoin(current, location)
                continue
            if response.status_code >= 400:
                raise AnalysisError(f"페이지가 {response.status_code} 응답을 반환했습니다.", 422)
            text = response.text
            if len(text) > 1_500_000:
                text = text[:1_500_000]
            return text
    raise AnalysisError("리다이렉트가 너무 많아 페이지를 읽지 못했습니다.", 422)


async def try_crawl4ai(url: str, provider: Provider) -> HardwareAnalysisResult | None:
    try:
        return await asyncio.wait_for(_crawl4ai(url, provider), timeout=50)
    except ImportError:
        logger.info("crawl4ai is not installed; falling back to HTTP fetch")
        return None
    except Exception:
        logger.exception("crawl4ai extraction failed for %s", url)
        return None


async def _crawl4ai(url: str, provider: Provider) -> HardwareAnalysisResult | None:
    from crawl4ai import AsyncWebCrawler, CacheMode, CrawlerRunConfig, LLMConfig
    from crawl4ai.extraction_strategy import LLMExtractionStrategy

    settings = get_settings()
    if provider == "openai":
        llm_config = LLMConfig(provider=f"openai/{settings.openai_model}", api_token=settings.openai_api_key)
    else:
        llm_config = LLMConfig(
            provider=f"ollama/{settings.ollama_model}",
            base_url=settings.ollama_base_url,
        )
    strategy = LLMExtractionStrategy(
        llm_config=llm_config,
        schema=json.dumps(
            {
                "name": "HardwareAnalysis",
                "type": "object",
                "properties": {
                    "spec": {"type": "object"},
                    "reviews": {"type": "object"},
                },
            }
        ),
        extraction_type="schema",
        instruction=(
            "Remove navigation, footer, ads, and scripts from consideration. "
            "Extract the product name, brand, category, price, a spec dictionary "
            "(cpu, gpu, ram, storage, display, battery, weight, power, extras), "
            "a Korean review summary, top 3 pros, top 3 cons, and who it is for. "
            "Return JSON with keys spec and reviews."
        ),
        input_format="fit_markdown",
        apply_chunking=False,
    )
    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        extraction_strategy=strategy,
        excluded_tags=["nav", "footer", "script", "style", "noscript", "iframe"],
        remove_overlay_popup=True,
        exclude_external_links=True,
        word_count_threshold=8,
    )
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url, config=config)
    raw = getattr(result, "extracted_content", None)
    if not raw:
        markdown = _markdown_from_result(result)
        if not markdown:
            return None
        from app.services.llm_service import structure_with_llm

        structured = await structure_with_llm(markdown, url, provider)
        structured.extractor = "crawl4ai"
        return structured
    payload = json.loads(raw)
    if isinstance(payload, list):
        payload = next((item for item in payload if isinstance(item, dict)), None)
    if not isinstance(payload, dict):
        return None
    spec_raw = payload.get("spec") or payload
    reviews_raw = payload.get("reviews") or {}
    specs = {
        str(key): str(value).strip()
        for key, value in (spec_raw.get("specs") or {}).items()
        if str(value).strip()
    }
    parsed = HardwareAnalysisResult(
        spec=ProductSpec(
            name=str(spec_raw.get("name") or "이름 없는 제품"),
            brand=str(spec_raw.get("brand") or "알 수 없음"),
            category=str(spec_raw.get("category") or "전자제품"),
            specs=specs,
            price=str(spec_raw["price"]).strip() if spec_raw.get("price") else None,
            url=url,
        ),
        reviews=ReviewSummary(
            overall=str(reviews_raw.get("overall") or reviews_raw.get("summary") or "리뷰 요약을 만들지 못했습니다."),
            pros=list(reviews_raw.get("pros") or reviews_raw.get("positive") or []),
            cons=list(reviews_raw.get("cons") or reviews_raw.get("negative") or []),
            recommended_for=list(reviews_raw.get("recommended_for") or reviews_raw.get("audience") or []),
            sentiment_score=float(reviews_raw.get("sentiment_score") or 50),
        ),
        source=provider,
        extractor="crawl4ai",
    )
    if not parsed.spec.specs and parsed.spec.name == "이름 없는 제품":
        return None
    return parsed


def _markdown_from_result(result: object) -> str:
    markdown = getattr(result, "markdown", None)
    if markdown is None:
        return ""
    if isinstance(markdown, str):
        return markdown
    for attr in ("fit_markdown", "raw_markdown"):
        text = getattr(markdown, attr, None)
        if text:
            return str(text)
    return str(markdown)


def cleaned_markdown(html: str) -> str:
    return html_to_markdown(html)
