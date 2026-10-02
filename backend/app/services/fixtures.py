from pathlib import Path

FIXTURE_DIR = Path(__file__).resolve().parent.parent / "fixtures"

PRESETS = [
    {
        "id": "laptops",
        "label": "노트북",
        "category": "노트북",
        "slugs": ["macbook-air-m3", "galaxy-book4-pro"],
    },
    {
        "id": "tablets",
        "label": "태블릿",
        "category": "태블릿",
        "slugs": ["ipad-pro-13-m4", "galaxy-tab-s9-ultra"],
    },
    {
        "id": "gpus",
        "label": "그래픽카드",
        "category": "그래픽카드",
        "slugs": ["rtx-4070-super", "rx-7800-xt"],
    },
]


def known_slugs() -> set[str]:
    return {slug for preset in PRESETS for slug in preset["slugs"]}


def demo_slug(url: str) -> str | None:
    from urllib.parse import urlparse

    parsed = urlparse(str(url))
    host = (parsed.hostname or "").lower()
    path = parsed.path.strip("/")
    slugs = known_slugs()
    if host == "demo.specpulse.app" and path in slugs:
        return path
    prefix = "demo/products/"
    if path.startswith(prefix):
        slug = path[len(prefix) :]
        if slug in slugs:
            return slug
    return None


def demo_url(slug: str) -> str:
    return f"https://demo.specpulse.app/{slug}"


def load_fixture(slug: str) -> str | None:
    path = FIXTURE_DIR / f"{slug}.html"
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8")
