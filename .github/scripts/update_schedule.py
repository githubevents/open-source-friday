"""
Fetches all issues labelled 'scheduled' from the open-source-friday repo,
parses each issue body for the guest name and stream date, looks up the host
from the issue assignees, and rewrites the schedule table in README.md.
"""

import json
import os
import re
import sys
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

REPO = "githubevents/open-source-friday"
README_PATH = "README.md"
START_MARKER = "<!-- SCHEDULE_START -->"
END_MARKER = "<!-- SCHEDULE_END -->"

# Map GitHub logins → display names for the hosting team
HOST_NAMES = {
    "AndreaGriffiths11": "Andrea Griffiths",
    "LadyKerr": "Kedasha Kerr",
    "KevinCrosby": "Kevin Crosby",
}


def gh_get(path: str, token: str) -> list | dict:
    url = f"https://api.github.com{path}"
    req = Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    with urlopen(req) as resp:
        return json.loads(resp.read())


def fetch_scheduled_issues(token: str) -> list:
    issues = []
    page = 1
    while True:
        batch = gh_get(
            f"/repos/{REPO}/issues?labels=scheduled&state=open&per_page=100&page={page}",
            token,
        )
        if not batch:
            break
        issues.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return issues


def parse_field(body: str, label: str) -> str:
    """Extract the value under a ### <label> heading in the issue body."""
    pattern = rf"###\s+{re.escape(label)}\s*\n+(.+?)(?=\n###|\Z)"
    match = re.search(pattern, body, re.DOTALL)
    if not match:
        return ""
    return match.group(1).strip()


_MONTHS = (
    "January|February|March|April|May|June|"
    "July|August|September|October|November|December"
)


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
    # "Month D, YYYY" or "Month DD YYYY"
    m = re.search(rf"({_MONTHS})\s+(\d{{1,2}}),?\s+(\d{{4}})", title)
    if m:
        return f"{m.group(1)} {m.group(2)}, {m.group(3)}"
    return ""


def parse_date(raw: str) -> datetime | None:
    """Try common date formats found in the issues."""
    raw = raw.strip()
    for fmt in ("%m-%d-%Y", "%m/%d/%Y", "%B %d, %Y", "%B %-d, %Y"):
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


def build_row(issue: dict) -> dict | None:
    body = issue.get("body") or ""
    title = issue.get("title") or ""
    number = issue["number"]
    url = issue["html_url"]

    guest_name = parse_field(body, "Name")
    raw_date = parse_field(body, "Dates")
    project = parse_field(body, "Project Name")

    # Fall back to extracting date from the issue title for manually-created issues
    if not raw_date or raw_date.upper() in ("TBD", "_NO RESPONSE_", "NOT YET", ""):
        raw_date = parse_date_from_title(title)

    # For manually-created issues the guest name may be in the title
    # e.g. "Open Source Friday - Guest Name - MM-DD-YYYY"
    if not guest_name:
        parts = [p.strip() for p in re.split(r"\s+-\s+", title)]
        # Remove the leading "Open Source Friday..." segment and trailing date segment
        candidates = [p for p in parts[1:] if not re.search(r"\d{4}", p)]
        if candidates:
            guest_name = candidates[0]

    # Skip issues where the date is clearly TBD / not set
    if not raw_date or raw_date.upper() in ("TBD", "_NO RESPONSE_", "NOT YET"):
        print(f"  Skipping #{number}: date is '{raw_date}'")
        return None

    date_obj = parse_date(raw_date)
    if not date_obj:
        print(f"  Skipping #{number}: could not parse date '{raw_date}'")
        return None

    assignees = issue.get("assignees") or []
    if assignees:
        host = ", ".join(
            HOST_NAMES.get(a["login"], a["login"]) for a in assignees
        )
    else:
        host = "TBD"

    return {
        "date": date_obj,
        "date_str": date_obj.strftime("%B %-d, %Y"),
        "guest": guest_name or "TBD",
        "project": project or "TBD",
        "host": host,
        "url": url,
        "number": number,
    }


def build_table(rows: list) -> str:
    today = datetime.now(tz=None).replace(hour=0, minute=0, second=0, microsecond=0)
    upcoming = sorted(
        [r for r in rows if r["date"] >= today],
        key=lambda r: r["date"],
    )

    if not upcoming:
        return "_No upcoming streams scheduled yet._\n"

    lines = [
        "| Date | Guest | Project | Host |",
        "| ---- | ----- | ------- | ---- |",
    ]
    for r in upcoming:
        lines.append(
            f"| {r['date_str']} | [{r['guest']}]({r['url']}) | {r['project']} | {r['host']} |"
        )
    return "\n".join(lines) + "\n"


def update_readme(table_md: str) -> bool:
    with open(README_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    if START_MARKER not in content or END_MARKER not in content:
        print("ERROR: schedule markers not found in README.md")
        sys.exit(1)

    new_block = f"{START_MARKER}\n{table_md}{END_MARKER}"
    updated = re.sub(
        rf"{re.escape(START_MARKER)}.*?{re.escape(END_MARKER)}",
        new_block,
        content,
        flags=re.DOTALL,
    )

    if updated == content:
        print("README.md is already up to date.")
        return False

    with open(README_PATH, "w", encoding="utf-8") as f:
        f.write(updated)
    print("README.md updated.")
    return True


def main():
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("ERROR: GITHUB_TOKEN environment variable is not set.")
        sys.exit(1)

    print("Fetching scheduled issues…")
    try:
        issues = fetch_scheduled_issues(token)
    except HTTPError as e:
        print(f"ERROR: GitHub API request failed: {e}")
        sys.exit(1)

    print(f"Found {len(issues)} scheduled issue(s).")

    rows = []
    for issue in issues:
        row = build_row(issue)
        if row:
            rows.append(row)

    print(f"Parsed {len(rows)} issue(s) with valid dates.")
    table_md = build_table(rows)
    update_readme(table_md)


if __name__ == "__main__":
    main()
