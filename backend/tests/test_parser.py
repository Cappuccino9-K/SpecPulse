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


DANAWA_SPEC = """
<div class="spec_list">
  <div class="items">
    <a><u>RTX 5090</u></a> / <a><u>PCIe5.0x16</u></a> / <a><u>850W 이상</u></a> /
    <a><u>전원 포트</u></a>: <a><u>16핀(12V2x6) x1</u></a> /
    <a><u>가로(길이)</u></a>: <a><u>357.6mm</u></a> /
    <a><u>부스트클럭</u></a>: <a><u>2580MHz</u></a> /
    <a><u>OC클럭</u></a>: <a><u>2610MHz</u></a> /
    <a><u>스트림 프로세서</u></a>: <a><u>21760</u></a> /
    <span><u>GDDR7</u></span> /
    <a><u>VRAM 대역폭</u></a>: <span><u>1792 GB/s</u></span> /
    <span><u>출력단자</u></span>: <a><u>HDMI2.1</u></a> , <a><u>DP2.1</u></a> /
    <a><u>두께</u></a>: <a><u>76mm</u></a> /
    <span><u>Dual BIOS</u></span> / <span><u>백플레이트</u></span>
  </div>
</div>
<p class="lwst_prc"><em>9,705,990</em>원</p>
<h3 class="prod_tit">ASUS ROG Astral 지포스 RTX 5090 WHITE OC D7 32GB</h3>
"""


def test_danawa_spec_list_is_not_price_only() -> None:
    result = parse_hardware(DANAWA_SPEC, "https://prod.danawa.com/info/?pcode=1")
    assert result.spec.price == "9,705,990원"
    assert "5090" in result.spec.name
    assert result.spec.specs["gpu"] == "RTX 5090"
    assert result.spec.specs["power"] == "850W 이상"
    assert result.spec.specs["부스트클럭"] == "2580MHz"
    assert result.spec.specs["가로(길이)"] == "357.6mm"
    assert result.spec.specs["VRAM 대역폭"] == "1792 GB/s"
    assert result.spec.specs["출력단자"] == "HDMI2.1 , DP2.1"
    assert "Dual BIOS" in result.spec.specs["extras"]
    assert "백플레이트" in result.spec.specs["extras"]


def test_compuzone_spec_class_reads_cpu_line() -> None:
    html = """
    <h1>인텔 코어 i3-14100</h1>
    <span class="p_spec" style="width:1068px;">인텔(소켓1700) / 4코어 / 8쓰레드 / 기본 클럭: 3.5GHz / 최대 클럭: 4.7GHz / 캐시: 12MB / PBP: 60W / 메모리 규격: DDR4 / 3200MHz / DDR5 / 4800MHz / 내장그래픽: 탑재 / 랩터레이크 리프레시 / 코어 i3 / 벌크 (쿨러 미포함) / 7nm</span>
    <div class="respect">이 문장은 spec이 아닙니다 / a / b / c / d</div>
    """
    result = parse_hardware(html, "https://www.compuzone.co.kr/product/1")
    assert result.spec.category == "CPU"
    assert result.spec.specs["소켓"] == "인텔(소켓1700)"
    assert result.spec.specs["코어"] == "4코어"
    assert result.spec.specs["스레드"] == "8쓰레드"
    assert result.spec.specs["기본 클럭"] == "3.5GHz"
    assert result.spec.specs["최대 클럭"] == "4.7GHz"
    assert result.spec.specs["캐시"] == "12MB"
    assert result.spec.specs["power"] == "60W"
    assert result.spec.specs["메모리 규격"] == "DDR4 3200MHz, DDR5 4800MHz"
    assert result.spec.specs["내장그래픽"] == "탑재"
    assert result.spec.specs["cpu"] == "코어 i3"
    assert result.spec.specs["공정"] == "7nm"
    assert "이 문장은 spec이 아닙니다" not in " ".join(result.spec.specs.values())


def test_generic_spec_table_keeps_unlisted_labels() -> None:
    html = """
    <h1>샘플 그래픽카드</h1>
    <table>
      <tr><td>부스트클럭</td><td>2400MHz</td></tr>
      <tr><td>메모리</td><td>16GB</td></tr>
    </table>
    <div><span class="tit">두께</span><span class="desc">50mm</span></div>
    """
    result = parse_hardware(html, "https://shop.example/gpu")
    assert result.spec.specs["부스트클럭"] == "2400MHz"
    assert result.spec.specs["ram"] == "16GB"
    assert result.spec.specs["두께"] == "50mm"


def test_markdown_strips_chrome() -> None:
    html = load_fixture("galaxy-book4-pro")
    assert html is not None
    markdown = html_to_markdown(html)
    assert "SPECPULSE_NAV_NOISE" not in markdown
    assert "SPECPULSE_FOOTER_NOISE" not in markdown
    assert "SPECPULSE_AD_NOISE" not in markdown
    assert "Galaxy Book4 Pro" in markdown
    assert "2880" in markdown
