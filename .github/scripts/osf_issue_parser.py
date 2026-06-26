from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime

# Map GitHub logins → display names for the hosting team
HOST_NAMES = {
    "AndreaGriffiths11": "Andrea Griffiths",
    "KevinCrosby": "Kevin Crosby",
    "marlenezw": "Marlene Mhangami",
    "madebygps": "Gwyneth Peña-Siguenza",
}

EMPTY_VALUES = {"TBD", "_NO RESPONSE_", "NOT YET", ""}

_MONTHS = (
    "January|February|March|April|May|June|"
    "July|August|September|October|November|December"
)

@dataclass
class ParsedIssue:
    guest_name: str
    github_handle: str
    bio: str
    project_name: str
    project_url: str
    raw_date: str
    date_obj: datetime | None
    date_str: str
    host_name: str     # Single host for promo video (TBD if multiple assignees)
    all_hosts: str     # All assignees joined by commas for the schedule table
    url: str
    number: int


def parse_field(body: str, label: str) -> str:
    """Extract the value under a ### <label> heading in the issue body."""
    # This covers both the old version (with trailing \Z) and new version
    pattern = rf"###\s+{re.escape(label)}\s*\n+(.+?)(?=\n###|\Z)"
    match = re.search(pattern, body, re.DOTALL)
    if not match:
        return ""
    val = match.group(1).strip()
    if val.upper() in EMPTY_VALUES:
        return ""
    return val

def parse_date_from_title(title: str) -> str:
    """Try to extract a date string from an issue title."""
    # Bracketed MM-DD-YYYY e.g. [04-17-2026]
    m = re.search(r"\[(\d{1,2}-\d{1,2}-\d{4})\]", title)
    if m:
        return m.group(1)
    # Unbracketed MM-DD-YYYY
    m = re.search(r"(\d{1,2}-\d{1,2}-\d{4})", title)
    if m:
        return m.group(1)
    # 2-digit year MM-DD-YY e.g. 06-19-26
    m = re.search(r"(\d{1,2}-\d{1,2}-(\d{2}))(?:$|\s)", title)
    if m and len(m.group(2)) == 2:
        return m.group(1)[:-2] + "20" + m.group(2)
    # "Month D, YYYY" or "Month DD YYYY"
    m = re.search(rf"({_MONTHS})\s+(\d{{1,2}}),?\s+(\d{{4}})", title)
    if m:
        return f"{m.group(1)} {m.group(2)}, {m.group(3)}"
    
    # Generic short fallback for extract_guest_metadata.py compatibility
    m = re.search(r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})", title)
    if m:
        return m.group(1)
        
    return ""

def parse_date(raw: str) -> datetime | None:
    """Try common date formats found in the issues."""
    raw = raw.strip()
    for fmt in ("%m-%d-%Y", "%m-%d-%y", "%m/%d/%Y", "%B %d, %Y", "%B %-d, %Y"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            pass
    # Try without leading zeros via regex
    m = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$", raw)
    if m:
        month, day, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return datetime(year, month, day)
        except ValueError:
            pass
    return None

def parse_issue(issue: dict) -> ParsedIssue:
    body = issue.get("body") or ""
    title = issue.get("title") or ""
    number = issue.get("number", 0)
    url = issue.get("html_url", "")

    guest_name = parse_field(body, "Name")
    github_handle = parse_field(body, "GitHub Handle").lstrip("@")
    bio = parse_field(body, "Tell us about yourself")
    project_name = parse_field(body, "Project Name")
    project_url = parse_field(body, "Project Repo Link")
    
    # We explicitly need the unparsed original dates string, taking EMPTY_VALUES as missing
    raw_date = ""
    # We do a custom field match so we can see the exact uppercase string
    date_match = re.search(r"### Dates\s*\n+(.+?)(?=\n###|\Z)", body, re.DOTALL)
    if date_match:
        val = date_match.group(1).strip()
        if val.upper() not in EMPTY_VALUES:
            raw_date = val

    if not raw_date:
        raw_date = parse_date_from_title(title)

    if not guest_name:
        # First try Calendly-style body: "Name: Angela Wen @handle"
        m = re.search(r"Name:\s+(.+?)(?:\s*@\S+)?\s*$", body, re.MULTILINE)
        if m:
            guest_name = m.group(1).strip()

    if not guest_name:
        parts = [p.strip() for p in re.split(r"\s+-\s+", title)]
        # Remove the leading "Open Source Friday..." segment and trailing date segment
        candidates = [p for p in parts[1:] if not re.search(r"\d{4}|\d{2}$", p)]
        if candidates:
            guest_name = candidates[0]

    date_obj = parse_date(raw_date)
    date_str = date_obj.strftime("%B %-d, %Y") if date_obj else "Date TBD"

    assignees = issue.get("assignees") or []
    if assignees:
        all_hosts = ", ".join(HOST_NAMES.get(a["login"], a["login"]) for a in assignees)
    else:
        all_hosts = "TBD"

    # Single host for promo
    if len(assignees) == 1:
        login = assignees[0]["login"]
        host_name = HOST_NAMES.get(login, login)
    else:
        host_name = "TBD"

    return ParsedIssue(
        guest_name=guest_name or "Guest",
        github_handle=github_handle,
        bio=bio,
        project_name=project_name or "Open Source",
        project_url=project_url,
        raw_date=raw_date,
        date_obj=date_obj,
        date_str=date_str,
        host_name=host_name,
        all_hosts=all_hosts,
        url=url,
        number=number,
    )

def to_schedule_row(parsed: ParsedIssue) -> dict | None:
    if not parsed.date_obj:
        return None
    return {
        "date": parsed.date_obj,
        "date_str": parsed.date_str,
        "guest": parsed.guest_name if parsed.guest_name != "Guest" else "TBD",
        "project": parsed.project_name if parsed.project_name != "Open Source" else "TBD",
        "host": parsed.all_hosts,
        "url": parsed.url,
        "number": parsed.number,
    }

def to_guest_promo_metadata(parsed: ParsedIssue) -> dict:
    bio = parsed.bio
    if bio and len(bio) > 280:
        bio = bio[:277] + "..."

    return {
        "guest_name": parsed.guest_name,
        "github_handle": parsed.github_handle,
        "project_name": parsed.project_name,
        "project_url": parsed.project_url,
        "bio": bio,
        "stream_date": parsed.date_str if parsed.date_obj else (parsed.raw_date if parsed.raw_date else "Date TBD"),
        "stream_time": "1 PM ET",
        "host_name": parsed.host_name,
        "issue_number": parsed.number,
        "issue_url": parsed.url,
        "has_audio": False,
    }
