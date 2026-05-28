#!/usr/bin/env python3
"""Extract guest metadata from a scheduled issue and write guest-promo.json."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
from datetime import datetime

import sentry_sdk

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN", ""),
    traces_sample_rate=0,
    environment="github-actions",
)
sentry_sdk.set_tag("workflow", "guest-promo-extract")

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO = "githubevents/open-source-friday"
HOST_NAMES = {
    "AndreaGriffiths11": "Andrea Griffiths",
    "KevinCrosby": "Kevin Crosby",
    "marlenezw": "Marlene Mhangami",
    "madebygps": "Gwyneth Peña-Siguenza",
}


def fetch_issue(number: int) -> dict:
    url = f"https://api.github.com/repos/{REPO}/issues/{number}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "osf-guest-promo",
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def parse_field(body: str, field: str) -> str:
    m = re.search(rf"### {re.escape(field)}\s*\n+(.+?)(?:\n###|\Z)", body, re.DOTALL)
    if m:
        val = m.group(1).strip()
        if val.upper() not in ("_NO RESPONSE_", "TBD", "NOT YET", ""):
            return val
    return ""


def parse_date(raw: str) -> str:
    for fmt in ("%m-%d-%Y", "%m-%d-%y", "%m/%d/%Y", "%B %d, %Y", "%B %-d, %Y"):
        try:
            return datetime.strptime(raw.strip(), fmt).strftime("%B %-d, %Y")
        except ValueError:
            continue
    return raw


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: extract_guest_metadata.py <issue_number>")
        sys.exit(1)

    number = int(sys.argv[1])
    issue = fetch_issue(number)
    body = issue.get("body") or ""
    title = issue.get("title") or ""

    guest_name = parse_field(body, "Name")
    github_handle = parse_field(body, "GitHub Handle").lstrip("@")
    bio = parse_field(body, "Tell us about yourself")
    project_name = parse_field(body, "Project Name")
    project_url = parse_field(body, "Project Repo Link")
    raw_date = parse_field(body, "Dates")

    # Calendly-style body: "Name: Angela Wen @handle"
    if not guest_name:
        m = re.search(r"Name:\s+(.+?)(?:\s*@\S+)?\s*$", body, re.MULTILINE)
        if m:
            guest_name = m.group(1).strip()

    # Title-based date fallback
    if not raw_date or raw_date.upper() in ("TBD", "_NO RESPONSE_", "NOT YET", ""):
        m = re.search(r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})", title)
        if m:
            raw_date = m.group(1)

    stream_date = parse_date(raw_date) if raw_date else "Date TBD"

    assignees = issue.get("assignees") or []
    host_name = "TBD"
    if assignees:
        login = assignees[0]["login"]
        host_name = HOST_NAMES.get(login, login)

    # Truncate bio for video overlay
    if bio and len(bio) > 280:
        bio = bio[:277] + "..."

    metadata = {
        "guest_name": guest_name or "Guest",
        "github_handle": github_handle,
        "project_name": project_name or "Open Source",
        "project_url": project_url,
        "bio": bio,
        "stream_date": stream_date,
        "stream_time": "1 PM ET",
        "host_name": host_name,
        "issue_number": number,
        "issue_url": issue["html_url"],
        "has_audio": False,  # set to True by workflow after TTS succeeds
    }

    output_path = os.environ.get("METADATA_OUTPUT", "video/public/guest-promo.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"✅ Wrote metadata for '{guest_name}' → {output_path}")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
