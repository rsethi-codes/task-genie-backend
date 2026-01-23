import pytest

def test_create_minimal_task(client, auth_headers):
    payload = {"title": "Minimal Task"}
    response = client.post("/tasks", json=payload, headers=auth_headers)
    assert response.status_code == 201
    task = response.json()
    assert task["title"] == "Minimal Task"
    assert task["status"] == "PENDING"

def test_create_full_task(client, auth_headers):
    payload = {
        "title": "Full Task",
        "description": "With description",
        "priority": "urgent",
        "tags": ["work", "urgent"],
        "dueDate": "2026-12-31T23:59:59Z"
    }
    response = client.post("/tasks", json=payload, headers=auth_headers)
    assert response.status_code == 201
    task = response.json()
    assert task["priority"] == "urgent"
    assert "work" in task["tags"]

def test_get_tasks_filter(client, auth_headers):
    # Create a task first
    client.post("/tasks", json={"title": "Tag Task", "tags": ["searchable"]}, headers=auth_headers)
    
    response = client.get("/tasks?tags=searchable", headers=auth_headers)
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) >= 1
    assert any(t["title"] == "Tag Task" for t in tasks)

def test_soft_delete_and_restore(client, auth_headers):
    # Create task
    task = client.post("/tasks", json={"title": "Delete Me"}, headers=auth_headers).json()
    task_id = task["id"]
    
    # Delete
    response = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify hidden
    response = client.get("/tasks", headers=auth_headers)
    tasks = response.json()
    assert not any(t["id"] == task_id for t in tasks)
    
    # Restore
    response = client.post(f"/tasks/{task_id}/restore", headers=auth_headers)
    assert response.status_code == 200
    
    # Verify visible
    response = client.get("/tasks", headers=auth_headers)
    tasks = response.json()
    assert any(t["id"] == task_id for t in tasks)

def test_unauthorized_task_access(client, auth_headers):
    # Create task with user A
    task = client.post("/tasks", json={"title": "Private Task"}, headers=auth_headers).json()
    task_id = task["id"]
    
    # Try access with user B
    other_headers = {"x-test-user-id": "other_user", "x-test-user-email": "other@example.com"}
    response = client.get(f"/tasks/{task_id}", headers=other_headers)
    assert response.status_code == 404 # Should be 404 to not leak existence

def test_audit_log_created(client, auth_headers):
    # Create task
    task = client.post("/tasks", json={"title": "Audit Task"}, headers=auth_headers).json()
    task_id = task["id"]
    
    # Check audit logs
    response = client.get(f"/audit-logs/task/{task_id}", headers=auth_headers)
    assert response.status_code == 200
    logs = response.json()
    assert any(log["action"] == "created" for log in logs)
