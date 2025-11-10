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
@pytest.mark.parametrize("headers", [None, {"accept": "text/event-stream"}])
def test_chat(authenticated_client: TestClient, headers: dict[str, str] | None) -> None:
    response = authenticated_client.post(
        "/chat", json={"query": "What crops are being grown in Kenya?"}, headers=headers
    )
    _ = response.raise_for_status()
