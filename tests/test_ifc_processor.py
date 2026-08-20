import pytest
from ifc_processor import meters_to_inches, check_door_compliance


class TestMetersToInches:
    def test_converts_standard_door_width(self):
        assert meters_to_inches(0.9144) == 36.0

    def test_converts_undersized_door(self):
        assert meters_to_inches(0.7112) == 28.0

    def test_converts_boundary_32_inches(self):
        assert meters_to_inches(0.8128) == 32.0

    def test_none_returns_none(self):
        assert meters_to_inches(None) is None


class TestCheckDoorCompliance:
    def make_ifc_data(self, doors):
        return {
            "project_name": "Test Building",
            "doors": doors,
            "door_count": len(doors),
            "levels": ["Level 1"],
        }

    def make_door(self, door_id, width_m=None, width_in=None):
        return {
            "id": door_id,
            "name": f"Door {door_id}",
            "guid": f"guid-{door_id}",
            "width": width_m,
            "width_in": width_in,
            "height": 2.032,
            "height_in": 80.0,
            "level": "Level 1",
            "type": None,
            "properties": {},
        }

    def make_codes(self, min_width=32.0):
        return {
            "min_door_width": min_width,
            "requirements": ["Minimum door width: 32 inches"],
        }

    def test_meter_widths_are_converted_before_comparison(self):
        doors = [
            self.make_door(1, width_m=0.9144, width_in=36.0),  # 36" -> pass
            self.make_door(2, width_m=0.7112, width_in=28.0),  # 28" -> fail
        ]
        result = check_door_compliance(self.make_ifc_data(doors), self.make_codes())

        assert result["total_doors"] == 2
        assert result["compliant_doors"] == 1
        assert result["non_compliant_doors"] == 1
        assert result["compliance_score"] == 50.0
        assert result["doors"]["compliant"][0]["id"] == 1
        assert result["doors"]["non_compliant"][0]["id"] == 2

    def test_raw_meter_width_without_width_in_is_converted(self):
        doors = [self.make_door(1, width_m=0.9144, width_in=None)]  # 36" raw meters
        result = check_door_compliance(self.make_ifc_data(doors), self.make_codes())

        assert result["compliant_doors"] == 1
        assert "36.0 in" in result["doors"]["compliant"][0]["compliance_message"]

    def test_exact_boundary_width_is_compliant(self):
        doors = [self.make_door(1, width_m=0.8128, width_in=32.0)]
        result = check_door_compliance(self.make_ifc_data(doors), self.make_codes())

        assert result["compliant_doors"] == 1

    def test_missing_width_is_non_compliant_with_message(self):
        doors = [self.make_door(1, width_m=None, width_in=None)]
        result = check_door_compliance(self.make_ifc_data(doors), self.make_codes())

        assert result["non_compliant_doors"] == 1
        assert result["doors"]["non_compliant"][0]["compliance_message"] == "Door width information missing"

    def test_empty_door_list_scores_zero(self):
        result = check_door_compliance(self.make_ifc_data([]), self.make_codes())

        assert result["total_doors"] == 0
        assert result["compliance_score"] == 0.0

    def test_custom_minimum_width_from_code(self):
        doors = [self.make_door(1, width_m=0.7112, width_in=28.0)]
        codes = self.make_codes(min_width=28.0)
        result = check_door_compliance(self.make_ifc_data(doors), codes)

        assert result["compliant_doors"] == 1

    def test_report_contains_building_code_source(self):
        doors = [self.make_door(1, width_m=0.9144, width_in=36.0)]
        result = check_door_compliance(self.make_ifc_data(doors), self.make_codes())

        assert result["building_code"]["min_door_width"] == 32.0
        assert "requirements" in result["building_code"]