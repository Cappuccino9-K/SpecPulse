from app.services.fixtures import load_fixture
from app.services.parser import html_to_markdown, parse_hardware


def test_parses_macbook_and_drops_noise() -> None:
    html = load_fixture("macbook-air-m3")
    assert html is not None
    result = parse_hardware(html, "https://demo.specpulse.app/macbook-air-m3")
    assert result.spec.name == "MacBook Air 13 (M3, 2024)"
    assert result.spec.brand == "Apple"
    assert result.spec.category == "노트북"
    assert result.spec.price == "1,590,000원"
    assert result.spec.specs["ram"] == "16GB 통합메모리"
    assert result.spec.specs["cpu"] == "Apple M3 8코어"
    assert len(result.reviews.pros) == 3
    assert len(result.reviews.cons) == 3
    assert result.reviews.recommended_for
    blob = " ".join(
        [
            result.reviews.overall,
            *result.reviews.pros,
            *result.reviews.cons,
            *result.spec.specs.values(),
        ]
    )
    assert "SPECPULSE_NAV_NOISE" not in blob
    assert "SPECPULSE_AD_NOISE" not in blob
    assert "SPECPULSE_FOOTER_NOISE" not in blob
    assert 0 <= result.reviews.sentiment_score <= 100


def test_markdown_strips_chrome() -> None:
    html = load_fixture("galaxy-book4-pro")
    assert html is not None
    markdown = html_to_markdown(html)
    assert "SPECPULSE_NAV_NOISE" not in markdown
    assert "SPECPULSE_FOOTER_NOISE" not in markdown
    assert "SPECPULSE_AD_NOISE" not in markdown
    assert "Galaxy Book4 Pro" in markdown
    assert "2880" in markdown
