import pytest

def test_get_me(client, auth_headers):
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "profile" in data

def test_update_preferences(client, auth_headers):
    payload = {
        "defaultPriority": "high",
        "workStartTime": "08:00"
    }
    response = client.patch("/users/me/preferences", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["defaultPriority"] == "high"
    assert data["workStartTime"] == "08:00"

def test_invalid_preferences(client, auth_headers):
    payload = {
        "defaultPriority": "invalid_value"
    }
    response = client.patch("/users/me/preferences", json=payload, headers=auth_headers)
    assert response.status_code == 400

def test_unauthorized(client):
    response = client.get("/users/me")
    # This might return 401 because requireAuth() is still active but our bypass isn't hit
    assert response.status_code == 401
