import pytest
from fastapi.testclient import TestClient


def test_unauthorized(client: TestClient) -> None:
    response = client.get("/me")
    assert response.status_code == 401


def test_login(client: TestClient) -> None:
    response = client.post(
        "/token", data={"username": "test-user", "password": "test-password"}
    )
    _ = response.raise_for_status()


@pytest.mark.integration
def test_chat(authenticated_client: TestClient) -> None:
    response = authenticated_client.post(
        "/chat", json={"query": "What crops are being grown in Kenya?"}
    )
    _ = response.raise_for_status()
