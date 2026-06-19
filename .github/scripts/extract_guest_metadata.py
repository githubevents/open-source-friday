#!/usr/bin/env python3
"""Extract guest metadata from a scheduled issue and write guest-promo.json."""
from __future__ import annotations

import json
import os
import sys
import urllib.request

import sentry_sdk

from osf_issue_parser import parse_issue, to_guest_promo_metadata

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN", ""),
    traces_sample_rate=0,
    environment="github-actions",
)
sentry_sdk.set_tag("workflow", "guest-promo-extract")

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO = "githubevents/open-source-friday"


def fetch_issue(number: int) -> dict:
    url = f"https://api.github.com/repos/{REPO}/issues/{number}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "osf-guest-promo",
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: extract_guest_metadata.py <issue_number>")
        sys.exit(1)

    number = int(sys.argv[1])
    issue = fetch_issue(number)
    
    parsed = parse_issue(issue)
    metadata = to_guest_promo_metadata(parsed)

    output_path = os.environ.get("METADATA_OUTPUT", "video/public/guest-promo.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"✅ Wrote metadata for '{metadata['guest_name']}' → {output_path}")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
