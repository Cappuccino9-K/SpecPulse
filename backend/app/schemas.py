from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, field_validator

Provider = Literal["local", "openai", "ollama"]
Extractor = Literal["parser", "llm", "crawl4ai"]


class ProductSpec(BaseModel):
    name: str
    brand: str
    category: str
    specs: dict[str, str] = Field(default_factory=dict)
    price: str | None = None
    url: str | None = None


class ReviewSummary(BaseModel):
    overall: str
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    recommended_for: list[str] = Field(default_factory=list)
    sentiment_score: float = Field(default=50, ge=0, le=100)

    @field_validator("pros", "cons", "recommended_for")
    @classmethod
    def trim_points(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item and item.strip()]
        return cleaned[:3]


class HardwareAnalysisResult(BaseModel):
    spec: ProductSpec
    reviews: ReviewSummary
    source: Provider = "local"
    extractor: Extractor = "parser"
    cached: bool = False


class SpecComparisonRow(BaseModel):
    key: str
    label: str
    values: list[str]
    winner_index: int | None = None
    note: str | None = None


class BuyingGuide(BaseModel):
    headline: str
    value_note: str
    picks: list[str]
    caveat: str


class CompareResponse(BaseModel):
    id: UUID | None = None
    products: list[HardwareAnalysisResult]
    summary: str
    guide: BuyingGuide
    spec_rows: list[SpecComparisonRow]
    provider: Provider
    created_at: datetime | None = None


class ExtractRequest(BaseModel):
    url: HttpUrl
    provider: Provider | None = None


class CompareRequest(BaseModel):
    urls: list[HttpUrl] = Field(min_length=2, max_length=2)
    provider: Provider | None = None

    @field_validator("urls")
    @classmethod
    def distinct_urls(cls, value: list[HttpUrl]) -> list[HttpUrl]:
        normalized = [str(item).rstrip("/") for item in value]
        if len(set(normalized)) != len(normalized):
            raise ValueError("서로 다른 제품 주소를 입력해 주세요.")
        return value


class HistoryItem(BaseModel):
    id: UUID
    title: str
    urls: list[str]
    provider: Provider
    created_at: datetime


class Preset(BaseModel):
    id: str
    label: str
    category: str
    urls: list[str]
