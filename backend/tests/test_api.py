import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_root():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "UrbanSolver API"


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_create_report():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/reports/", json={
            "latitude": 12.9716,
            "longitude": 77.5946,
            "category": "pothole",
            "severity": "high",
            "description": "Large pothole on main road causing traffic issues",
            "impact_description": "Two-wheelers at risk"
        })
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["category"] == "pothole"
    assert data["severity"] == "high"


@pytest.mark.asyncio
async def test_list_reports():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/reports/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)