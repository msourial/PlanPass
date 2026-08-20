"""End-to-end test for the PlanPass compliance workflow using Playwright."""

import re

from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:5000"


def test_page_loads_with_planpass_branding(page: Page):
    page.goto(BASE_URL)
    expect(page).to_have_title(re.compile(r"PlanPass"))
    expect(page.locator("h1")).to_contain_text("PlanPass")
    expect(page.locator("#uploadForm")).to_be_visible()


def test_sample_model_flow_produces_report(page: Page):
    page.goto(BASE_URL)

    # Click the sample model button -> auto-fills file + zip and submits
    page.click("#sampleModelBtn")

    # Report panel becomes visible after analysis completes
    expect(page.locator("#reportPanel")).to_be_visible(timeout=30000)

    # Compliance score should be 40% for the sample building
    expect(page.locator("#scoreText")).to_have_text("40%", timeout=30000)

    # Door summary
    expect(page.locator("#totalDoors")).to_have_text("5")
    expect(page.locator("#compliantDoors")).to_have_text("2")
    expect(page.locator("#nonCompliantDoors")).to_have_text("3")

    # Non-compliant doors table is shown with rows
    expect(page.locator("#nonCompliantDoorsSection")).to_be_visible()
    expect(page.locator("#nonCompliantDoorsTable tr")).to_have_count(3)

    # Verification hash populated
    expect(page.locator("#verificationHash")).not_to_have_text("Not generated")

    # Viewer rendered with 5 door elements
    expect(page.locator(".door-element")).to_have_count(5)


def test_door_focus_and_filter_controls(page: Page):
    page.goto(BASE_URL)
    page.click("#sampleModelBtn")
    expect(page.locator("#reportPanel")).to_be_visible(timeout=30000)

    # Filter to non-compliant only -> 3 doors visible
    page.select_option("#elementFilter", "non-compliant")
    expect(page.locator(".door-element:visible")).to_have_count(3)

    # Reset view shows all 5
    page.click("#resetViewBtn")
    expect(page.locator(".door-element:visible")).to_have_count(5)

    # Focus a non-compliant door from the report table
    page.locator(".focus-door-btn").first.click()
    expect(page.locator(".door-element.door-focus")).to_have_count(1)


def test_pdf_download_button_available(page: Page):
    page.goto(BASE_URL)
    page.click("#sampleModelBtn")
    expect(page.locator("#reportPanel")).to_be_visible(timeout=30000)
    expect(page.locator("#downloadReportBtn")).to_be_enabled()