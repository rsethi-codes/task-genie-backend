import pytest
import httpx
import os
import subprocess
import time
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("API_URL", "http://localhost:4000/api/v1")

@pytest.fixture(scope="session", autouse=True)
def run_server():
    # Attempt to start the server in test mode if not already running
    # This is a bit complex in a shared environment, so we assume it's running 
    # OR we start it as a subprocess.
    # For this implementation, we assume the user will run the server separately 
    # with NODE_ENV=test.
    pass

@pytest.fixture
def client():
    return httpx.Client(base_url=BASE_URL, timeout=10)

@pytest.fixture
def auth_headers():
    return {
        "x-test-user-id": "user_test_123",
        "x-test-user-email": "test@example.com"
    }

@pytest.fixture
def admin_headers():
    return {
        "x-test-user-id": "admin_test_123",
        "x-test-user-email": "admin@example.com"
    }

@pytest.fixture(autouse=True)
def clean_db():
    # In a real scenario, this would truncate tables in the test database
    # For now, we'll assume the test runner handles it or we use fresh IDs
    yield
