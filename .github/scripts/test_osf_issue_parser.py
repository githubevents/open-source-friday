import unittest
from datetime import datetime

from osf_issue_parser import (
    parse_field,
    parse_date_from_title,
    parse_date,
    parse_issue,
    to_schedule_row,
    to_guest_promo_metadata,
    ParsedIssue
)

class TestOSFIssueParser(unittest.TestCase):
    def test_parse_field(self):
        body = "### Name\n\nAlice\n\n### Dates\n\n_No response_"
        self.assertEqual(parse_field(body, "Name"), "Alice")
        self.assertEqual(parse_field(body, "Dates"), "")
        self.assertEqual(parse_field(body, "Missing"), "")

    def test_parse_date_from_title(self):
        self.assertEqual(parse_date_from_title("Guest - [04-17-2026]"), "04-17-2026")
        self.assertEqual(parse_date_from_title("Guest - 04-17-2026"), "04-17-2026")
        self.assertEqual(parse_date_from_title("Guest - 04-17-26"), "04-17-2026")
        self.assertEqual(parse_date_from_title("Guest - April 17, 2026"), "April 17, 2026")
        self.assertEqual(parse_date_from_title("Guest without date"), "")

    def test_parse_date(self):
        self.assertEqual(parse_date("04-17-2026"), datetime(2026, 4, 17))
        self.assertEqual(parse_date("04-17-26"), datetime(2026, 4, 17))
        self.assertEqual(parse_date("4/17/2026"), datetime(2026, 4, 17))
        self.assertEqual(parse_date("April 17, 2026"), datetime(2026, 4, 17))
        self.assertIsNone(parse_date("Date TBD"))

    def test_parse_issue_template(self):
        issue = {
            "title": "Open Source Friday - John Doe",
            "body": "### Name\n\nJohn Doe\n\n### Dates\n\n05-01-2026",
            "assignees": [{"login": "AndreaGriffiths11"}]
        }
        parsed = parse_issue(issue)
        self.assertEqual(parsed.guest_name, "John Doe")
        self.assertEqual(parsed.raw_date, "05-01-2026")
        self.assertEqual(parsed.date_obj, datetime(2026, 5, 1))
        self.assertEqual(parsed.host_name, "Andrea Griffiths")
        self.assertEqual(parsed.all_hosts, "Andrea Griffiths")

    def test_parse_issue_calendly(self):
        issue = {
            "title": "Open Source Friday",
            "body": "Name: Jane Smith @janesmith\nDates: 05-02-2026",
            "assignees": []
        }
        parsed = parse_issue(issue)
        self.assertEqual(parsed.guest_name, "Jane Smith")
        self.assertEqual(parsed.host_name, "TBD")
        self.assertEqual(parsed.all_hosts, "TBD")

    def test_parse_issue_multiple_assignees(self):
        issue = {
            "title": "Guest",
            "body": "### Name\n\nBob\n\n### Dates\n\n05-03-2026",
            "assignees": [{"login": "AndreaGriffiths11"}, {"login": "KevinCrosby"}]
        }
        parsed = parse_issue(issue)
        # Multiple hosts -> promo host should be TBD, schedule hosts should list all
        self.assertEqual(parsed.host_name, "TBD")
        self.assertEqual(parsed.all_hosts, "Andrea Griffiths, Kevin Crosby")

    def test_to_schedule_row(self):
        issue = {
            "title": "Guest",
            "body": "### Name\n\nBob\n\n### Dates\n\n05-03-2026",
            "number": 123,
            "html_url": "http://example.com"
        }
        parsed = parse_issue(issue)
        row = to_schedule_row(parsed)
        self.assertIsNotNone(row)
        self.assertEqual(row["guest"], "Bob")
        self.assertEqual(row["date"], datetime(2026, 5, 3))
        self.assertEqual(row["number"], 123)
        self.assertEqual(row["url"], "http://example.com")

    def test_to_schedule_row_missing_date(self):
        issue = {
            "title": "Guest",
            "body": "### Name\n\nBob\n\n### Dates\n\nTBD"
        }
        parsed = parse_issue(issue)
        row = to_schedule_row(parsed)
        self.assertIsNone(row)

    def test_to_guest_promo_metadata(self):
        issue = {
            "title": "Guest",
            "body": "### Name\n\nBob\n\n### Dates\n\n05-03-2026\n\n### Tell us about yourself\n\n" + ("A" * 300),
            "number": 123,
            "html_url": "http://example.com",
            "assignees": [{"login": "AndreaGriffiths11"}]
        }
        parsed = parse_issue(issue)
        meta = to_guest_promo_metadata(parsed)
        self.assertEqual(meta["guest_name"], "Bob")
        self.assertEqual(meta["stream_date"], "May 3, 2026")
        self.assertEqual(meta["host_name"], "Andrea Griffiths")
        self.assertTrue(len(meta["bio"]) <= 280)
        self.assertTrue(meta["bio"].endswith("..."))
        self.assertEqual(meta["issue_number"], 123)

if __name__ == "__main__":
    unittest.main()
