"""
Fetches all issues labelled 'scheduled' from the open-source-friday repo,
parses each issue body for the guest name and stream date, looks up the host
from the issue assignees, and rewrites the schedule table in README.md.
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import sentry_sdk

from osf_issue_parser import parse_issue, to_schedule_row

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN", ""),
    traces_sample_rate=0,
    environment="github-actions",
)
sentry_sdk.set_tag("workflow", "update-schedule")

# TEST: send a message to verify Sentry is connected — remove after confirming
sentry_sdk.capture_message("✅ Sentry connected to OSF update-schedule workflow", level="info")

REPO = "githubevents/open-source-friday"
README_PATH = "README.md"
START_MARKER = "<!-- SCHEDULE_START -->"
END_MARKER = "<!-- SCHEDULE_END -->"


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
        parsed = parse_issue(issue)
        row = to_schedule_row(parsed)
        if not row:
            print(f"  Skipping #{issue['number']}: could not parse valid date")
            continue
        rows.append(row)

    print(f"Parsed {len(rows)} issue(s) with valid dates.")
    table_md = build_table(rows)
    update_readme(table_md)


if __name__ == "__main__":
    main()
