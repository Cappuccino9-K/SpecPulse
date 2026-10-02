import json
import re
from bs4 import BeautifulSoup, Tag

from app.schemas import HardwareAnalysisResult, ProductSpec, ReviewSummary

NOISE_TAGS = ["nav", "footer", "script", "style", "noscript", "iframe", "svg", "form"]
NOISE_HINTS = ("ad", "ads", "banner", "cookie", "popup", "newsletter", "sponsor")

SPEC_ALIASES: list[tuple[str, tuple[str, ...]]] = [
    ("cpu", ("cpu", "프로세서", "processor", "칩셋")),
    ("gpu", ("gpu", "그래픽", "graphics", "그래픽카드")),
    ("ram", ("ram", "메모리", "memory", "unified")),
    ("storage", ("storage", "저장공간", "저장장치", "ssd", "저장")),
    ("display", ("display", "디스플레이", "화면", "해상도", "패널")),
    ("battery", ("battery", "배터리", "사용시간")),
    ("weight", ("weight", "무게", "중량")),
    ("power", ("전력", "tdp", "tgp", "tbp", "소비전력")),
    ("extras", ("기타", "특징", "extras")),
]

BRANDS = [
    ("Apple", ("apple", "맥북", "macbook", "ipad", "아이패드")),
    ("Samsung", ("samsung", "삼성", "galaxy", "갤럭시")),
    ("NVIDIA", ("nvidia", "지포스", "geforce", "rtx")),
    ("AMD", ("amd", "radeon", "라데온", "rx ")),
    ("LG", ("lg ", "lg전자")),
    ("ASUS", ("asus", "에이수스")),
    ("Lenovo", ("lenovo", "레노버")),
]

POSITIVE_WORDS = ("좋", "만족", "훌륭", "추천", "조용", "선명", "가볍", "빠르", "오래", "괜찮", "편리", "여유")
NEGATIVE_WORDS = ("아쉽", "부족", "발열", "무겁", "비싸", "느리", "버벅", "시끄", "단점", "별로", "피로", "빠듯")


def parse_hardware(html: str, url: str) -> HardwareAnalysisResult:
    soup = BeautifulSoup(html, "html.parser")
    strip_noise(soup)
    name = _name(soup)
    brand = _brand(soup, name)
    category = _category(soup, name)
    price = _price(soup)
    specs = _specs(soup)
    pros = _items(soup, "ul.pros li")
    cons = _items(soup, "ul.cons li")
    recommended = _items(soup, "ul.recommend li")
    reviews = [node.get_text(" ", strip=True) for node in soup.select(".review")]
    reviews = [text for text in reviews if text]
    summary_node = soup.select_one("p.summary")
    if summary_node:
        overall = summary_node.get_text(" ", strip=True)
    else:
        overall = _overall(name, pros, cons, reviews)
    if not pros:
        pros = _mine(reviews, positive=True)
    if not cons:
        cons = _mine(reviews, positive=False)
    if not name and not specs:
        raise ValueError("페이지에서 제품 스펙을 찾지 못했습니다.")
    return HardwareAnalysisResult(
        spec=ProductSpec(
            name=name or "이름 없는 제품",
            brand=brand,
            category=category,
            specs=specs,
            price=price,
            url=url,
        ),
        reviews=ReviewSummary(
            overall=overall,
            pros=pros,
            cons=cons,
            recommended_for=recommended,
            sentiment_score=_sentiment(pros, cons, reviews),
        ),
        source="local",
        extractor="parser",
    )


def strip_noise(soup: BeautifulSoup) -> None:
    for tag in soup.find_all(NOISE_TAGS):
        tag.decompose()
    for node in list(soup.find_all(True)):
        if not isinstance(node, Tag) or not node.attrs:
            continue
        identity = " ".join(
            [str(node.get("id") or ""), " ".join(node.get("class") or [])]
        ).lower()
        if any(hint in identity for hint in NOISE_HINTS):
            node.decompose()


def html_to_markdown(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    strip_noise(soup)
    lines: list[str] = []
    for node in soup.find_all(["h1", "h2", "h3", "p", "li", "tr"]):
        text = node.get_text(" ", strip=True)
        if not text:
            continue
        if node.name == "h1":
            lines.append(f"# {text}")
        elif node.name == "h2":
            lines.append(f"## {text}")
        elif node.name == "h3":
            lines.append(f"### {text}")
        elif node.name == "tr":
            cells = [cell.get_text(" ", strip=True) for cell in node.find_all(["th", "td"])]
            if any(cells):
                lines.append("| " + " | ".join(cells) + " |")
        elif node.name == "li":
            lines.append(f"- {text}")
        else:
            lines.append(text)
    return "\n".join(lines)


def _name(soup: BeautifulSoup) -> str:
    for selector in (".prod_tit", ".prod_name", "h1"):
        heading = soup.select_one(selector)
        if heading is None:
            continue
        text = heading.get_text(" ", strip=True)
        if text and text.casefold() not in {"danawa", "다나와"}:
            return text
    og = soup.find("meta", property="og:title")
    if og and og.get("content"):
        return str(og["content"]).split(":")[0].strip()
    if soup.title and soup.title.string:
        return re.split(r"[·:|]", soup.title.string)[0].strip()
    return ""


def _brand(soup: BeautifulSoup, name: str) -> str:
    meta = soup.find("meta", attrs={"name": "brand"})
    if meta and meta.get("content"):
        return str(meta["content"]).strip()
    haystack = name.lower()
    for label, tokens in BRANDS:
        if any(token in haystack for token in tokens):
            return label
    return "알 수 없음"


def _category(soup: BeautifulSoup, name: str) -> str:
    meta = soup.find("meta", attrs={"name": "category"})
    if meta and meta.get("content"):
        return str(meta["content"]).strip()
    haystack = f"{name} {soup.get_text(' ', strip=True)[:400]}".lower()
    if any(token in haystack for token in ("그래픽카드", "geforce", "radeon", "rtx", "gpu")):
        return "그래픽카드"
    if any(token in haystack for token in ("태블릿", "ipad", "아이패드", "galaxy tab")):
        return "태블릿"
    if any(token in haystack for token in ("노트북", "macbook", "laptop", "그램")):
        return "노트북"
    return "전자제품"


def _price(soup: BeautifulSoup) -> str | None:
    for selector in (".lwst_prc", ".prc_c", ".price_real", "[itemprop=price]", ".price"):
        node = soup.select_one(selector)
        if node is None:
            continue
        found = _price_in_text(node.get_text(" ", strip=True))
        if found:
            return found
    return _price_in_text(soup.get_text(" ", strip=True)[:4000])


def _price_in_text(text: str) -> str | None:
    match = re.search(r"(?:₩\s*)?(\d{1,3}(?:,\d{3})+|\d{4,})\s*원", text)
    if match:
        return f"{match.group(1)}원"
    dollar = re.search(r"\$\s*(\d{1,3}(?:,\d{3})+|\d+)", text)
    if dollar:
        return f"${dollar.group(1)}"
    return None


def _specs(soup: BeautifulSoup) -> dict[str, str]:
    found: dict[str, str] = {}
    for label, value in [
        *_table_pairs(soup),
        *_definition_pairs(soup),
        *_labeled_pairs(soup),
        *_jsonld_pairs(soup),
        *_slash_pairs(soup),
    ]:
        _store_spec(found, label, value)
    return found


def _store_spec(found: dict[str, str], label: str, value: str) -> None:
    clean_label = _clean_label(label)
    clean_value = re.sub(r"\s+", " ", value).strip(" ,/")
    if not clean_label or not clean_value or len(clean_value) > 180:
        return
    key = _canonical(clean_label) or clean_label
    if key in found:
        if clean_label in {"특징", "기타"}:
            existing = [part.strip() for part in found[key].split(",")]
            if clean_value not in existing:
                found[key] = f"{found[key]}, {clean_value}"
        return
    found[key] = clean_value


def _table_pairs(soup: BeautifulSoup) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for row in soup.find_all("tr"):
        cells = [cell.get_text(" ", strip=True) for cell in row.find_all(["th", "td"])]
        cells = [cell for cell in cells if cell]
        if len(cells) < 2 or cells[0] in {"항목", "스펙"}:
            continue
        pairs.append((cells[0], cells[1]))
    return pairs


def _definition_pairs(soup: BeautifulSoup) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for term in soup.find_all("dt"):
        value_node = term.find_next_sibling("dd")
        if value_node is None:
            continue
        pairs.append((term.get_text(" ", strip=True), value_node.get_text(" ", strip=True)))
    return pairs


def _labeled_pairs(soup: BeautifulSoup) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for row in soup.select("li, div"):
        label_node = row.select_one(":scope > .tit, :scope > .label, :scope > .spec_tit")
        value_node = row.select_one(":scope > .desc, :scope > .value, :scope > .spec_desc")
        if label_node is None or value_node is None:
            continue
        pairs.append((label_node.get_text(" ", strip=True), value_node.get_text(" ", strip=True)))
    return pairs


def _jsonld_pairs(soup: BeautifulSoup) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            continue
        for node in _json_nodes(payload):
            props = node.get("additionalProperty")
            if isinstance(props, dict):
                props = [props]
            if not isinstance(props, list):
                continue
            for prop in props:
                if not isinstance(prop, dict):
                    continue
                name = prop.get("name")
                value = prop.get("value")
                if name and value is not None:
                    pairs.append((str(name), str(value)))
    return pairs


def _json_nodes(payload: object) -> list[dict]:
    nodes: list[dict] = []
    if isinstance(payload, dict):
        nodes.append(payload)
        for value in payload.values():
            nodes.extend(_json_nodes(value))
    elif isinstance(payload, list):
        for item in payload:
            nodes.extend(_json_nodes(item))
    return nodes


def _slash_pairs(soup: BeautifulSoup) -> list[tuple[str, str]]:
    nodes = soup.select(".spec_list .items, [class*='spec_list'] .items")
    if not nodes:
        nodes = soup.select(".spec_list")
    if not nodes:
        nodes = [
            node
            for node in soup.find_all(["div", "p"])
            if isinstance(node, Tag) and _looks_like_spec_line(node.get_text(" ", strip=True)) and not node.find(["div", "p"])
        ]
    pairs: list[tuple[str, str]] = []
    seen: set[str] = set()
    for node in nodes:
        text = node.get_text(" ", strip=True)
        if text in seen or not _looks_like_spec_line(text):
            continue
        seen.add(text)
        features: list[str] = []
        for segment in re.split(r"\s+/\s+", text):
            segment = segment.strip(" ,")
            if not segment:
                continue
            if ":" in segment:
                label, value = segment.split(":", 1)
                pairs.append((label, value))
                continue
            label, value = _classify_bare(segment)
            if label == "특징":
                features.append(value)
            else:
                pairs.append((label, value))
        if features:
            pairs.append(("특징", ", ".join(features)))
    return pairs


def _looks_like_spec_line(text: str) -> bool:
    return 20 < len(text) < 4000 and text.count(" / ") >= 3


def _classify_bare(token: str) -> tuple[str, str]:
    if re.search(r"\b(rtx|gtx|rx|arc)\s*\d", token, re.I) or any(word in token for word in ("지포스", "라데온")):
        return "gpu", token
    if re.search(r"pcie\s*\d", token, re.I):
        return "인터페이스", token
    if re.search(r"\d+(?:\.\d+)?\s*w\b", token, re.I):
        return "power", token
    if re.search(r"gddr\d|hbm\d?", token, re.I):
        return "메모리 종류", token
    if re.search(r"\d+\s*팬", token):
        return "팬", token
    return "특징", token


def _clean_label(label: str) -> str:
    text = re.sub(r"\s+", " ", label).strip(" :/|")
    if not text or len(text) > 40:
        return ""
    if text.casefold() in {"항목", "스펙", "spec", "specification", "상품정보"}:
        return ""
    return text


def _canonical(label: str) -> str | None:
    lowered = re.sub(r"\s+", "", label.casefold())
    for key, aliases in SPEC_ALIASES:
        if lowered in {alias.replace(" ", "") for alias in aliases}:
            return key
    return None


def _items(soup: BeautifulSoup, selector: str) -> list[str]:
    return [node.get_text(" ", strip=True) for node in soup.select(selector) if node.get_text(strip=True)][:3]


def _mine(reviews: list[str], positive: bool) -> list[str]:
    words = POSITIVE_WORDS if positive else NEGATIVE_WORDS
    picked = [text for text in reviews if any(word in text for word in words)]
    return picked[:3]


def _overall(name: str, pros: list[str], cons: list[str], reviews: list[str]) -> str:
    if reviews:
        lead = reviews[0]
    elif pros:
        lead = pros[0]
    else:
        lead = "스펙 표 중심으로 정리했습니다."
    weakness = cons[0] if cons else "반복해서 지적된 단점은 많지 않습니다."
    return f"{name} 리뷰에서는 {lead} 반면 {weakness}"


def _sentiment(pros: list[str], cons: list[str], reviews: list[str]) -> float:
    positive = " ".join([*pros, *reviews])
    negative = " ".join(cons)
    positive_hits = sum(positive.count(word) for word in POSITIVE_WORDS) + len(pros)
    negative_hits = sum(negative.count(word) for word in NEGATIVE_WORDS) + len(cons)
    total = positive_hits + negative_hits
    if total == 0:
        return 60.0
    ratio = positive_hits / total
    return round(min(92, max(46, 42 + ratio * 50)), 1)
