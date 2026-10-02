import json
import logging
import re

import httpx

from app.config import Provider, get_settings
from app.schemas import BuyingGuide, HardwareAnalysisResult, ProductSpec, ReviewSummary
from app.services.compare_service import local_guide

logger = logging.getLogger(__name__)

STRUCTURE_SCHEMA = {
    "spec": {
        "name": "제품명",
        "brand": "브랜드",
        "category": "CPU|메모리|저장장치|메인보드|파워|모니터|노트북|태블릿|그래픽카드|전자제품",
        "specs": {
            "cpu": "",
            "gpu": "",
            "ram": "",
            "storage": "",
            "display": "",
            "battery": "",
            "weight": "",
            "power": "",
            "extras": "",
        },
        "price": "표시 가격 또는 빈 문자열",
    },
    "reviews": {
        "overall": "리뷰 총평 두 문장 이내",
        "pros": ["장점1", "장점2", "장점3"],
        "cons": ["단점1", "단점2", "단점3"],
        "recommended_for": ["추천 사용자1", "추천 사용자2"],
        "sentiment_score": 70,
    },
}


class LlmError(RuntimeError):
    pass


async def structure_with_llm(markdown: str, url: str, provider: Provider) -> HardwareAnalysisResult:
    prompt = (
        "당신은 전자제품 페이지를 구조화하는 분석가입니다. "
        "아래 마크다운에 있는 내용만 사용하고, 없는 스펙은 빈 문자열로 두세요. "
        "pros, cons, recommended_for는 각각 최대 3개이며 한국어입니다. "
        "sentiment_score는 0부터 100 사이 숫자입니다. JSON만 반환하세요.\n"
        f"스키마 예시:\n{json.dumps(STRUCTURE_SCHEMA, ensure_ascii=False)}\n\n"
        f"URL: {url}\n\n{markdown[:14000]}"
    )
    payload = await _complete(provider, prompt)
    spec_raw = payload.get("spec") or {}
    specs = {
        key: str(value).strip()
        for key, value in (spec_raw.get("specs") or {}).items()
        if str(value).strip()
    }
    reviews_raw = payload.get("reviews") or {}
    result = HardwareAnalysisResult(
        spec=ProductSpec(
            name=str(spec_raw.get("name") or "이름 없는 제품").strip(),
            brand=str(spec_raw.get("brand") or "알 수 없음").strip(),
            category=str(spec_raw.get("category") or "전자제품").strip(),
            specs=specs,
            price=(str(spec_raw.get("price")).strip() or None) if spec_raw.get("price") else None,
            url=url,
        ),
        reviews=ReviewSummary(
            overall=str(reviews_raw.get("overall") or "리뷰 요약을 만들지 못했습니다.").strip(),
            pros=list(reviews_raw.get("pros") or []),
            cons=list(reviews_raw.get("cons") or []),
            recommended_for=list(reviews_raw.get("recommended_for") or []),
            sentiment_score=_score(reviews_raw.get("sentiment_score")),
        ),
        source=provider,
        extractor="llm",
    )
    if result.spec.name == "이름 없는 제품" and not result.spec.specs:
        raise LlmError("LLM이 스펙을 추출하지 못했습니다.")
    return result


async def guide_with_llm(products: list[HardwareAnalysisResult], provider: Provider) -> BuyingGuide:
    brief = [
        {
            "name": product.spec.name,
            "price": product.spec.price,
            "specs": product.spec.specs,
            "pros": product.reviews.pros,
            "cons": product.reviews.cons,
            "recommended_for": product.reviews.recommended_for,
        }
        for product in products
    ]
    prompt = (
        "두 전자제품을 비교하는 구매 가이드를 한국어 JSON으로만 작성하세요. "
        "없는 숫자를 만들지 마세요.\n"
        '{"headline":"한 줄 결론","value_note":"가성비","picks":["첫 제품 추천","둘째 제품 추천"],"caveat":"한계"}\n'
        f"{json.dumps(brief, ensure_ascii=False)}"
    )
    try:
        payload = await _complete(provider, prompt)
        guide = BuyingGuide.model_validate(payload)
    except Exception as exc:
        logger.warning("LLM guide failed, using local guide: %s", exc)
        return local_guide(products)
    if len(guide.picks) < 2:
        return local_guide(products)
    return guide


async def _complete(provider: Provider, prompt: str) -> dict:
    settings = get_settings()
    if provider == "openai":
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.openai_api_key}"}
        body = {
            "model": settings.openai_model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": "JSON만 반환합니다."},
                {"role": "user", "content": prompt},
            ],
        }
        content = await _post_chat(url, headers, body, openai=True)
    elif provider == "ollama":
        url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
        body = {
            "model": settings.ollama_model,
            "stream": False,
            "format": "json",
            "messages": [{"role": "user", "content": prompt}],
        }
        content = await _post_chat(url, {}, body, openai=False)
    else:
        raise LlmError("로컬 엔진은 LLM 호출을 사용하지 않습니다.")
    return _loads_json(content)


async def _post_chat(url: str, headers: dict[str, str], body: dict, openai: bool) -> str:
    try:
        async with httpx.AsyncClient(timeout=50) as client:
            response = await client.post(url, headers=headers, json=body)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise LlmError("언어 모델 요청이 실패했습니다.") from exc
    if openai:
        return str(data["choices"][0]["message"]["content"])
    message = data.get("message") or {}
    return str(message.get("content") or "")


def _loads_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        cleaned = cleaned[start : end + 1]
    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise LlmError("언어 모델이 JSON을 반환하지 않았습니다.") from exc
    if not isinstance(payload, dict):
        raise LlmError("언어 모델 응답 형식이 올바르지 않습니다.")
    return payload


def _score(value: object) -> float:
    try:
        score = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 50
    return max(0, min(100, score))
