import re

from app.schemas import BuyingGuide, HardwareAnalysisResult, SpecComparisonRow

SPEC_FIELDS = [
    ("price", "가격"),
    ("cpu", "CPU"),
    ("gpu", "GPU"),
    ("ram", "메모리"),
    ("storage", "저장공간"),
    ("display", "디스플레이"),
    ("battery", "배터리"),
    ("weight", "무게"),
    ("power", "전력"),
    ("extras", "기타"),
]

HIGHER_BETTER = {"ram", "storage", "display", "battery", "cpu", "gpu"}
LOWER_BETTER = {"price", "weight", "power"}

CPU_RANKS = sorted(
    [
        ("apple m4", 93),
        ("apple m3", 84),
        ("m4", 93),
        ("m3", 84),
        ("core ultra 9", 88),
        ("core ultra 7", 80),
        ("ultra 7", 80),
        ("core ultra 5", 72),
        ("snapdragon 8 gen 3", 76),
        ("snapdragon 8 gen 2", 68),
        ("ryzen 9", 86),
        ("ryzen 7", 78),
    ],
    key=lambda item: len(item[0]),
    reverse=True,
)

GPU_RANKS = sorted(
    [
        ("rtx 4090", 99),
        ("rtx 4080", 94),
        ("rtx 4070 ti super", 90),
        ("rtx 4070 super", 86),
        ("rtx 4070", 80),
        ("rx 7900 xtx", 96),
        ("rx 7900 xt", 92),
        ("rx 7800 xt", 84),
        ("rx 7700 xt", 76),
        ("10코어 gpu", 72),
        ("intel arc", 58),
        ("adreno", 60),
    ],
    key=lambda item: len(item[0]),
    reverse=True,
)


def build_spec_rows(products: list[HardwareAnalysisResult]) -> list[SpecComparisonRow]:
    rows: list[SpecComparisonRow] = []
    for key, label in SPEC_FIELDS:
        values = [_value_for(product, key) for product in products]
        if not any(values):
            continue
        winner, note = _winner(key, values)
        rows.append(SpecComparisonRow(key=key, label=label, values=values, winner_index=winner, note=note))
    return rows


def local_guide(products: list[HardwareAnalysisResult]) -> BuyingGuide:
    rows = build_spec_rows(products)
    names = [product.spec.name for product in products]
    wins = [0 for _ in products]
    won_labels: list[list[str]] = [[] for _ in products]
    for row in rows:
        if row.winner_index is None:
            continue
        wins[row.winner_index] += 1
        won_labels[row.winner_index].append(row.label)

    lead = max(range(len(products)), key=lambda index: wins[index])
    if wins[lead] == 0:
        headline = f"{names[0]}와 {names[1]}는 수치로 갈리는 항목이 적어, 화면 취향과 사용 환경으로 고르는 비교입니다."
    else:
        parts = []
        for index, name in enumerate(names):
            if won_labels[index]:
                parts.append(f"{name} 쪽은 {'·'.join(won_labels[index])}에서 우위")
            else:
                parts.append(f"{name} 쪽은 수치 우위보다 사용감으로 볼 비교")
        headline = "한 줄로 보면 " + ", ".join(parts) + "입니다."

    value_note = _value_note(products, wins)
    picks = []
    for product in products:
        audience = ", ".join(product.reviews.recommended_for) or "이 제품의 강점이 필요한 사용자"
        picks.append(f"{product.spec.name} 쪽을 고르면 좋은 경우: {audience}.")
    caveat = "이 가이드는 해당 페이지의 스펙 표와 리뷰 문장을 기준으로 합니다. 판매 가격과 재고는 매장마다 달라질 수 있습니다."
    return BuyingGuide(headline=headline, value_note=value_note, picks=picks, caveat=caveat)


def guide_to_summary(guide: BuyingGuide) -> str:
    return "\n\n".join([guide.headline, guide.value_note, *guide.picks, guide.caveat])


def _value_note(products: list[HardwareAnalysisResult], wins: list[int]) -> str:
    prices = [_parse_price(product.spec.price or "") for product in products]
    if any(price is None for price in prices):
        return "페이지에서 가격을 모두 확인하지 못해, 가성비는 우위 항목 수로만 보았습니다. 우위는 " + " 대 ".join(
            f"{product.spec.name} {count}개" for product, count in zip(products, wins, strict=True)
        ) + "입니다."
    assert prices[0] is not None and prices[1] is not None
    if _currency_mismatch(prices[0], prices[1]):
        return "통화가 달라 가격을 직접 빼지 않았습니다. 구매 전 같은 통화의 현재가로 다시 확인해 주세요."
    cheaper = 0 if prices[0] <= prices[1] else 1
    gap = abs(prices[0] - prices[1])
    gap_label = _money(gap, prices[cheaper])
    return (
        f"표시 가격은 {products[cheaper].spec.name} 쪽이 {gap_label} 더 낮습니다. "
        f"스펙 우위 항목은 {products[0].spec.name} {wins[0]}개, {products[1].spec.name} {wins[1]}개입니다."
    )


def _value_for(product: HardwareAnalysisResult, key: str) -> str:
    if key == "price":
        return product.spec.price or ""
    return product.spec.specs.get(key, "")


def _winner(key: str, values: list[str]) -> tuple[int | None, str | None]:
    if key not in HIGHER_BETTER and key not in LOWER_BETTER:
        return None, None
    if len(values) != 2 or not values[0] or not values[1]:
        return None, None
    metrics = _metrics(key, values[0], values[1])
    if metrics is None:
        return None, None
    left, right, unit = metrics
    if not _meaningful(key, left, right):
        return None, None
    higher_wins = key in HIGHER_BETTER
    left_wins = left > right if higher_wins else left < right
    winner = 0 if left_wins else 1
    return winner, _note(key, left, right, unit)


def _metrics(key: str, left: str, right: str) -> tuple[float, float, str] | None:
    if key == "price":
        a, b = _parse_price(left), _parse_price(right)
        if a is None or b is None or _currency_mismatch(a, b):
            return None
        return a, b, "money"
    if key in {"ram", "storage"}:
        a, b = _capacity_gb(left), _capacity_gb(right)
        if a is None or b is None:
            return None
        return a, b, "GB"
    if key == "weight":
        a, b = _weight_g(left), _weight_g(right)
        if a is None or b is None:
            return None
        return a, b, "g"
    if key == "display":
        a, b = _pixels(left), _pixels(right)
        if a is None or b is None:
            return None
        return a, b, "px"
    if key == "battery":
        hours_a, hours_b = _hours(left), _hours(right)
        if hours_a is not None and hours_b is not None:
            return hours_a, hours_b, "시간"
        watt_a, watt_b = _wh(left), _wh(right)
        if watt_a is not None and watt_b is not None:
            return watt_a, watt_b, "Wh"
        return None
    if key == "power":
        a, b = _watts(left), _watts(right)
        if a is None or b is None:
            return None
        return a, b, "W"
    if key == "cpu":
        a, b = _rank(left, CPU_RANKS), _rank(right, CPU_RANKS)
        if a is None or b is None:
            return None
        return float(a), float(b), "chip"
    if key == "gpu":
        a, b = _rank(left, GPU_RANKS), _rank(right, GPU_RANKS)
        if a is None or b is None:
            return None
        return float(a), float(b), "chip"
    return None


def _meaningful(key: str, left: float, right: float) -> bool:
    if left == right:
        return False
    if key in {"cpu", "gpu"}:
        return abs(left - right) >= 8
    base = max(abs(left), abs(right), 1)
    return abs(left - right) / base >= 0.02


def _note(key: str, left: float, right: float, unit: str) -> str:
    gap = abs(left - right)
    if key == "price":
        return f"{_money(gap, min(left, right))} 저렴"
    if key in {"ram", "storage"}:
        if gap >= 1024 and gap % 1024 == 0:
            return f"{gap / 1024:.0f}TB 차이"
        return f"{gap:.0f}GB 차이"
    if key == "weight":
        return f"{gap:.0f}g 가벼움"
    if key == "battery":
        return f"{gap:.0f}{unit} 더 김"
    if key == "power":
        return f"{gap:.0f}W 낮음"
    if key == "display":
        return "해상도 우위"
    return "성능 점수 우위"


def _money(amount: float, sample: float) -> str:
    if sample >= 10000:
        man = amount / 10000
        if man >= 10:
            return f"{man:,.0f}만원"
        return f"{man:.1f}만원"
    return f"{amount:,.0f}"


def _parse_price(value: str) -> float | None:
    match = re.search(r"(\d{1,3}(?:,\d{3})+|\d+)", value.replace(" ", ""))
    if not match:
        return None
    return float(match.group(1).replace(",", ""))


def _currency_mismatch(left: float, right: float) -> bool:
    return (left >= 10000) != (right >= 10000)


def _capacity_gb(value: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*(tb|gb|mb)", value, re.I)
    if not match:
        return None
    amount = float(match.group(1))
    unit = match.group(2).lower()
    if unit == "tb":
        return amount * 1024
    if unit == "mb":
        return amount / 1024
    return amount


def _weight_g(value: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*(kg|g|킬로그램|그램)", value, re.I)
    if not match:
        return None
    amount = float(match.group(1))
    unit = match.group(2).lower()
    if unit in {"kg", "킬로그램"}:
        return amount * 1000
    return amount


def _pixels(value: str) -> float | None:
    match = re.search(r"(\d{3,5})\s*[x×]\s*(\d{3,5})", value, re.I)
    if not match:
        return None
    return float(match.group(1)) * float(match.group(2))


def _hours(value: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*시간", value)
    if not match:
        return None
    return float(match.group(1))


def _wh(value: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*wh", value, re.I)
    if not match:
        return None
    return float(match.group(1))


def _watts(value: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*w\b", value, re.I)
    if not match:
        return None
    return float(match.group(1))


def _rank(value: str, table: list[tuple[str, int]]) -> int | None:
    lowered = value.lower()
    found: list[int] = []
    for token, score in table:
        if token in lowered:
            found.append(score)
    if not found:
        return None
    return max(found)
