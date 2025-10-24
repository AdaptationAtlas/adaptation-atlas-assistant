from fastapi.testclient import TestClient


def test_unauthorized(client: TestClient) -> None:
    response = client.get("/me")
    assert response.status_code == 401


def test_login(client: TestClient) -> None:
    response = client.post(
        "/token", data={"username": "test-user", "password": "test-password"}
    )
    _ = response.raise_for_status()
