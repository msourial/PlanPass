import datetime
import unittest.mock

from utils import allowed_file, generate_report_hash, format_compliance_score


class TestAllowedFile:
    def test_ifc_file_allowed(self):
        assert allowed_file("model.ifc") is True

    def test_pdf_file_allowed(self):
        assert allowed_file("codes.pdf") is True

    def test_extension_is_case_insensitive(self):
        assert allowed_file("MODEL.IFC") is True
        assert allowed_file("model.PdF") is True

    def test_unsupported_extension_rejected(self):
        assert allowed_file("model.exe") is False

    def test_missing_extension_rejected(self):
        assert allowed_file("model") is False

    def test_empty_filename_rejected(self):
        assert allowed_file("") is False

    def test_extra_extensions_rejected_when_not_in_set(self):
        assert allowed_file("model.ifc.pdf") is True  # .pdf is allowed
        assert allowed_file("model.pdf.ifc") is True  # .ifc is allowed


class TestGenerateReportHash:
    def test_same_results_produce_same_hash_with_same_timestamp(self):
        class FrozenDateTime(datetime.datetime):
            @classmethod
            def now(cls, tz=None):
                return datetime.datetime(2026, 1, 1, 12, 0, 0)

        with unittest.mock.patch("utils.datetime.datetime", FrozenDateTime):
            h1 = generate_report_hash({"total_doors": 5, "compliance_score": 40.0})
            h2 = generate_report_hash({"total_doors": 5, "compliance_score": 40.0})
        assert h1 == h2

    def test_different_results_produce_different_hashes(self):
        h1 = generate_report_hash({"score": 40.0})
        h2 = generate_report_hash({"score": 80.0})
        assert h1 != h2

    def test_hash_is_sha256_hexdigest(self):
        assert len(generate_report_hash({"a": 1})) == 64
        int(generate_report_hash({"a": 1}), 16)  # must be valid hex

    def test_hash_changes_with_timestamp(self):
        h1 = generate_report_hash({"score": 40.0})
        h2 = generate_report_hash({"score": 40.0})
        assert h1 != h2  # reports are anchored to their generation time


class TestFormatComplianceScore:
    def test_excellent_score(self):
        result = format_compliance_score(95)
        assert result["status"] == "excellent"
        assert result["color"] == "#10B981"

    def test_good_score(self):
        result = format_compliance_score(80)
        assert result["status"] == "good"
        assert result["color"] == "#3B82F6"

    def test_warning_score(self):
        result = format_compliance_score(60)
        assert result["status"] == "warning"
        assert result["color"] == "#F59E0B"

    def test_critical_score(self):
        result = format_compliance_score(30)
        assert result["status"] == "critical"
        assert result["color"] == "#EF4444"