from fastapi.testclient import TestClient

from app.dependencies.auth import CurrentUser, require_current_user
from app.main import app

client = TestClient(app)


def test_me_requires_bearer_token() -> None:
    response = client.get("/v1/me")

    assert response.status_code == 401


def test_me_returns_authenticated_user() -> None:
    app.dependency_overrides[require_current_user] = lambda: CurrentUser(
        id="user-123",
        email="user@example.com",
    )

    try:
        response = client.get("/v1/me")
    finally:
        app.dependency_overrides.pop(require_current_user, None)

    assert response.status_code == 200
    assert response.json() == {"id": "user-123", "email": "user@example.com"}
