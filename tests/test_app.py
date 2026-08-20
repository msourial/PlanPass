import os
import json

import pytest

from app import app

SAMPLE_IFC = os.path.join(os.path.dirname(__file__), "..", "static", "sample_building.ifc")


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client


class TestIndexRoute:
    def test_index_renders(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert b"PlanPass" in response.data


class TestValidateZip:
    def test_known_zip_returns_location(self, client):
        response = client.post("/validate-zip", json={"zip_code": "77001"})
        data = response.get_json()

        assert response.status_code == 200
        assert data["success"] is True
        assert data["zip_info"]["city"] == "Houston"

    def test_missing_zip_returns_400(self, client):
        response = client.post("/validate-zip", json={})
        assert response.status_code == 400


class TestUpload:
    def test_upload_sample_ifc_scores_40_percent(self, client):
        with open(SAMPLE_IFC, "rb") as ifc_file:
            response = client.post(
                "/upload",
                data={
                    "ifc_file": (ifc_file, "sample_building.ifc"),
                    "zip_code": "77001",
                },
                content_type="multipart/form-data",
            )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

        results = data["compliance_results"]
        # 5 doors: 36", 28", 30", 34", 31" -> 2 compliant of 5
        assert results["total_doors"] == 5
        assert results["compliant_doors"] == 2
        assert results["non_compliant_doors"] == 3
        assert results["compliance_score"] == 40.0

        # Widths must be reported in inches, not raw meters
        widths = {d["id"]: d["width_in"] for d in results["doors"]["compliant"]}
        assert widths == {7: 36.0, 10: 34.0}

        assert data["report_hash"]
        assert len(data["report_hash"]) == 64

    def test_upload_without_file_returns_400(self, client):
        response = client.post(
            "/upload",
            data={"zip_code": "77001"},
            content_type="multipart/form-data",
        )
        assert response.status_code == 400

    def test_upload_with_invalid_zip_returns_400(self, client):
        with open(SAMPLE_IFC, "rb") as ifc_file:
            response = client.post(
                "/upload",
                data={
                    "ifc_file": (ifc_file, "sample_building.ifc"),
                    "zip_code": "12345",
                },
                content_type="multipart/form-data",
            )

        assert response.status_code == 400

    def test_upload_with_wrong_extension_returns_400(self, client):
        response = client.post(
            "/upload",
            data={
                "ifc_file": (__import__("io").BytesIO(b"not an ifc"), "model.txt"),
                "zip_code": "77001",
            },
            content_type="multipart/form-data",
        )
        assert response.status_code == 400

    def test_unknown_valid_zip_uses_state_default(self, client):
        with open(SAMPLE_IFC, "rb") as ifc_file:
            response = client.post(
                "/upload",
                data={
                    "ifc_file": (ifc_file, "sample_building.ifc"),
                    "zip_code": "77407",
                },
                content_type="multipart/form-data",
            )

        assert response.status_code == 200
        data = response.get_json()
        assert data["compliance_results"]["building_code"]["source"] == "Texas Building Code (Default)"