import ipaddress
import socket
from urllib.parse import urlparse

from app.services.fixtures import demo_slug

class UrlSafetyError(ValueError):
    pass


def validate_public_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise UrlSafetyError("http 또는 https 주소만 분석할 수 있습니다.")
    host = (parsed.hostname or "").lower()
    if not host:
        raise UrlSafetyError("주소에 호스트가 없습니다.")
    if demo_slug(url):
        return
    if host in {"localhost", "127.0.0.1", "::1"}:
        raise UrlSafetyError("로컬 주소는 데모 제품 페이지 경로만 허용됩니다.")
    if _is_blocked_ip(host):
        raise UrlSafetyError("내부망 주소는 보안상 분석할 수 없습니다.")
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror as exc:
        raise UrlSafetyError("주소를 찾을 수 없습니다. URL을 다시 확인해 주세요.") from exc
    for info in infos:
        ip_text = info[4][0]
        if _is_blocked_ip(ip_text):
            raise UrlSafetyError("내부망 주소는 보안상 분석할 수 없습니다.")


def _is_blocked_ip(value: str) -> bool:
    try:
        ip = ipaddress.ip_address(value)
    except ValueError:
        return False
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    )
