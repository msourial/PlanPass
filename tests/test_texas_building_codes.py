from texas_building_codes import (
    validate_texas_zip_code,
    get_building_codes_for_zip,
    get_zip_code_info,
)


class TestValidateTexasZipCode:
    def test_known_texas_zip_is_valid(self):
        assert validate_texas_zip_code("77001") is True

    def test_generic_texas_range_zip_is_valid(self):
        assert validate_texas_zip_code("77407") is True

    def test_out_of_range_zip_is_invalid(self):
        assert validate_texas_zip_code("12345") is False
        assert validate_texas_zip_code("99999") is False

    def test_non_digit_input_is_invalid(self):
        assert validate_texas_zip_code("abcde") is False

    def test_wrong_length_is_invalid(self):
        assert validate_texas_zip_code("770") is False
        assert validate_texas_zip_code("770011") is False

    def test_empty_input_is_invalid(self):
        assert validate_texas_zip_code("") is False

    def test_whitespace_is_stripped(self):
        assert validate_texas_zip_code(" 77001 ") is True


class TestGetBuildingCodesForZip:
    def test_known_zip_returns_jurisdiction_codes(self):
        codes = get_building_codes_for_zip("77001")

        assert codes["min_door_width"] == 32.0
        assert codes["location"]["city"] == "Houston"
        assert codes["location"]["jurisdiction"] == "City of Houston"
        assert "Texas Building Code" in codes["source"]

    def test_unknown_valid_zip_returns_default_codes(self):
        codes = get_building_codes_for_zip("77407")

        assert codes["min_door_width"] == 32.0
        assert codes["location"]["jurisdiction"] == "State of Texas"

    def test_results_include_requirements_and_exceptions(self):
        codes = get_building_codes_for_zip("77001")

        assert len(codes["requirements"]) > 0
        assert len(codes["exceptions"]) > 0
        assert len(codes["reference_sections"]) > 0


class TestGetZipCodeInfo:
    def test_known_zip_returns_city(self):
        info = get_zip_code_info("77001")

        assert info["valid"] is True
        assert info["city"] == "Houston"
        assert "Houston" in info["message"]

    def test_unknown_valid_zip_uses_state_default(self):
        info = get_zip_code_info("77407")

        assert info["valid"] is True
        assert info["jurisdiction"] == "State of Texas"

    def test_invalid_zip_is_rejected(self):
        info = get_zip_code_info("12345")

        assert info["valid"] is False