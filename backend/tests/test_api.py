from fastapi.testclient import TestClient

from app.main import app

MACBOOK = "https://demo.specpulse.app/macbook-air-m3"
GALAXY = "https://demo.specpulse.app/galaxy-book4-pro"


def test_compare_demo_pair_and_history() -> None:
    with TestClient(app) as client:
        response = client.post("/api/compare", json={"urls": [MACBOOK, GALAXY], "provider": "local"})
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["products"][0]["spec"]["name"].startswith("MacBook Air")
        assert body["products"][1]["spec"]["brand"] == "Samsung"
        assert body["summary"]
        assert body["guide"]["headline"]
        assert any(row["winner_index"] == 0 for row in body["spec_rows"])
        comparison_id = body["id"]
        history = client.get("/api/history")
        assert history.status_code == 200
        assert any(item["id"] == comparison_id for item in history.json())
        detail = client.get(f"/api/history/{comparison_id}")
        assert detail.status_code == 200
        assert detail.json()["id"] == comparison_id
        deleted = client.delete(f"/api/history/{comparison_id}")
        assert deleted.status_code == 204


def test_rejects_same_url_and_private_targets() -> None:
    with TestClient(app) as client:
        same = client.post("/api/compare", json={"urls": [MACBOOK, MACBOOK]})
        assert same.status_code == 422
        assert "서로 다른" in same.json()["detail"]
        blocked = client.post("/api/extract", json={"url": "http://169.254.169.254/latest/meta-data"})
        assert blocked.status_code == 400
        local = client.post("/api/extract", json={"url": "http://127.0.0.1:8765/admin"})
        assert local.status_code == 400
        demo = client.post(
            "/api/extract",
            json={"url": "http://127.0.0.1:8765/demo/products/rx-7800-xt", "provider": "local"},
        )
        assert demo.status_code == 200, demo.text
        assert demo.json()["spec"]["brand"] == "AMD"


def test_second_compare_is_cached() -> None:
    url = f"{MACBOOK}?case=cache"
    with TestClient(app) as client:
        first = client.post("/api/extract", json={"url": url, "provider": "local"})
        second = client.post("/api/extract", json={"url": url, "provider": "local"})
        assert first.status_code == 200
        assert second.status_code == 200
        assert first.json()["cached"] is False
        assert second.json()["cached"] is True
