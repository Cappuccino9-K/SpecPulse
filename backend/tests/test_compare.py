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


def test_gpu_winners() -> None:
    products = _pair("rtx-4070-super", "rx-7800-xt")
    assert _row(products, "price").winner_index == 1
    assert _row(products, "ram").winner_index == 1
    assert _row(products, "power").winner_index == 0
    assert _row(products, "gpu").winner_index is None
