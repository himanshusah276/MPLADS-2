import pytest
from fastapi.testclient import TestClient
from main import app
from app.db.session import SessionLocal
from app.services.seed_generator import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    db = SessionLocal()
    seed_database(db, target_project_count=100)
    db.close()

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

def test_demo_users_list():
    with TestClient(app) as client:
        response = client.get("/api/v1/auth/demo-users")
        assert response.status_code == 200
        users = response.json()
        assert len(users) >= 6
        roles = [u["role"] for u in users]
        assert "MINISTRY_ANALYST" in roles
        assert "AUDITOR" in roles

def test_dashboard_summary():
    with TestClient(app) as client:
        response = client.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        assert "counts" in data
        assert data["counts"]["total_projects"] > 0
        assert "top_risk_projects" in data
        assert len(data["top_risk_projects"]) > 0

def test_projects_list_and_detail():
    with TestClient(app) as client:
        response = client.get("/api/v1/projects")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0
        first_proj_id = data["items"][0]["id"]

        # Detail
        detail_res = client.get(f"/api/v1/projects/{first_proj_id}")
        assert detail_res.status_code == 200
        p_data = detail_res.json()
        assert "risk_breakdown" in p_data
        assert "subscores" in p_data["risk_breakdown"]
        assert "reasons" in p_data["risk_breakdown"]

def test_alerts_and_case_flow():
    with TestClient(app) as client:
        # Fetch alerts
        alt_res = client.get("/api/v1/alerts")
        assert alt_res.status_code == 200
        alerts = alt_res.json()["items"]
        assert len(alerts) > 0

        # Fetch cases
        cases_res = client.get("/api/v1/cases")
        assert cases_res.status_code == 200
        cases = cases_res.json()["items"]
        assert len(cases) > 0

def test_admin_config():
    with TestClient(app) as client:
        cfg_res = client.get("/api/v1/admin/config")
        assert cfg_res.status_code == 200
        weights = cfg_res.json()["weights"]
        assert "D1" in weights
        assert "D2" in weights
