import importlib
import os
import sys
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PNG = "data:image/png;base64,iVBORw0KGgo="


def load(monkeypatch, tmp_path, token="", verdict=None):
    monkeypatch.setenv("SCAM_DB_PATH", str(tmp_path / "t.db"))
    monkeypatch.setenv("SCAM_API_TOKEN", token)
    import main
    main = importlib.reload(main)
    parsed = verdict or main.Verdict(scam=True, target="students", reason="Promises guaranteed crypto returns.")
    calls = []

    def parse(**kwargs):
        calls.append(kwargs)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(parsed=parsed))])

    monkeypatch.setattr(main, "_client", SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(parse=parse))))
    return main, calls


def test_scam_is_stored_with_reason(monkeypatch, tmp_path):
    main, calls = load(monkeypatch, tmp_path)
    with TestClient(main.app) as client:
        r = client.post("/classify-image", json={"image_base64": PNG})
    assert r.status_code == 200 and r.json()["scam"] is True
    import sqlite3
    rows = sqlite3.connect(tmp_path / "t.db").execute("SELECT target, reason FROM scamdata").fetchall()
    assert rows == [("students", "Promises guaranteed crypto returns.")]
    assert calls[0]["messages"][0]["content"][1]["image_url"]["url"] == PNG


def test_token_required_when_configured(monkeypatch, tmp_path):
    main, _ = load(monkeypatch, tmp_path, token="s3cret")
    with TestClient(main.app) as client:
        assert client.post("/classify-image", json={"image_base64": PNG}).status_code == 401
        ok = client.post("/classify-image", json={"image_base64": PNG}, headers={"Authorization": "Bearer s3cret"})
        assert ok.status_code == 200
        assert client.get("/health").json() == {"ok": True, "auth_required": True}


def test_rejects_non_images_and_removed_test_endpoint(monkeypatch, tmp_path):
    main, calls = load(monkeypatch, tmp_path)
    with TestClient(main.app) as client:
        assert client.post("/classify-image", json={"image_base64": "javascript:alert(1)"}).status_code == 422
        assert client.post("/test", json={"image_base64": PNG}).status_code in (404, 405)
    assert calls == []


def test_extension_origin_cors(monkeypatch, tmp_path):
    main, _ = load(monkeypatch, tmp_path)
    origin = "chrome-extension://" + "a" * 32
    with TestClient(main.app) as client:
        r = client.options("/classify-image", headers={"Origin": origin, "Access-Control-Request-Method": "POST"})
        assert r.headers.get("access-control-allow-origin") == origin
        r = client.options("/classify-image", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"})
        assert "access-control-allow-origin" not in r.headers
