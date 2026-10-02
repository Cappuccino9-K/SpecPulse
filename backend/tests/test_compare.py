from app.services.compare_service import build_spec_rows, local_guide
from app.services.fixtures import load_fixture
from app.services.parser import parse_hardware


def _pair(left: str, right: str):
    left_html = load_fixture(left)
    right_html = load_fixture(right)
    assert left_html and right_html
    return [
        parse_hardware(left_html, f"https://demo.specpulse.app/{left}"),
        parse_hardware(right_html, f"https://demo.specpulse.app/{right}"),
    ]


def _row(products, key):
    rows = {row.key: row for row in build_spec_rows(products)}
    return rows[key]


def test_laptop_winners() -> None:
    products = _pair("macbook-air-m3", "galaxy-book4-pro")
    assert _row(products, "price").winner_index == 0
    assert _row(products, "display").winner_index == 1
    assert _row(products, "ram").winner_index is None
    assert _row(products, "gpu").winner_index == 0
    assert _row(products, "battery").winner_index == 0
    assert _row(products, "weight").winner_index is None
    guide = local_guide(products)
    assert "디스플레이" in guide.headline
    assert "30만원" in guide.value_note
    assert len(guide.picks) == 2


def test_tablet_winners() -> None:
    products = _pair("ipad-pro-13-m4", "galaxy-tab-s9-ultra")
    assert _row(products, "price").winner_index == 1
    assert _row(products, "cpu").winner_index == 0
    assert _row(products, "ram").winner_index == 1
    assert _row(products, "weight").winner_index == 0
    assert _row(products, "battery").winner_index == 1


def test_danawa_rows_compare_clock_and_length() -> None:
    left = parse_hardware(
        """
        <h1>A 카드</h1>
        <div class="spec_list"><div class="items">
          RTX 5090 / 850W 이상 / 부스트클럭: 2610MHz / 가로(길이): 304mm / VRAM 대역폭: 1792 GB/s
        </div></div>
        """,
        "https://prod.danawa.com/a",
    )
    right = parse_hardware(
        """
        <h1>B 카드</h1>
        <div class="spec_list"><div class="items">
          RTX 5080 / 750W 이상 / 부스트클럭: 2500MHz / 가로(길이): 330mm / VRAM 대역폭: 960 GB/s
        </div></div>
        """,
        "https://prod.danawa.com/b",
    )
    rows = {row.key: row for row in build_spec_rows([left, right])}
    assert rows["gpu"].values == ["RTX 5090", "RTX 5080"]
    assert rows["부스트클럭"].winner_index == 0
    assert rows["가로(길이)"].winner_index == 0
    assert rows["VRAM 대역폭"].winner_index == 0
    assert "price" not in rows


def test_gpu_winners() -> None:
    products = _pair("rtx-4070-super", "rx-7800-xt")
    assert _row(products, "price").winner_index == 1
    assert _row(products, "ram").winner_index == 1
    assert _row(products, "power").winner_index == 0
    assert _row(products, "gpu").winner_index is None
