#!/usr/bin/env python3
"""
Script to generate updated table content for Open Source Friday main table (Issue #152).
This script extracts current open issues and formats them for the admin table.
"""

import json
import re
from datetime import datetime

def extract_assignees_from_issue_data():
    """
    Extract assignee information from the GitHub API responses.
    In a real scenario, this would make API calls to get current issue data.
    """
    
    # Issue data extracted from GitHub API responses
    issues_data = {
        142: {"title": "Open Source Friday - Just a Job App - 07-25-25", "assignees": ["AndreaGriffiths11"]},
        143: {"title": "Open Source Friday - Keploy - 7-18-25", "assignees": ["LadyKerr"]},
        144: {"title": "Open Source Friday - Tesseral - 08/01/2025", "assignees": ["LadyKerr"]},
        148: {"title": "Open Source Friday - Secure Code Game - 08-22-2025", "assignees": ["AndreaGriffiths11"]},
        149: {"title": "Open Source Friday - Suricata - 08-29-2025", "assignees": ["LadyKerr"]},
        150: {"title": "Open Source Friday - vscode-demo-time - 09-05-2025", "assignees": ["AndreaGriffiths11"]},
        151: {"title": "Open Source Friday - `@simulacrum/github-api-simulator` - [MM-DD-YYYY]", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        153: {"title": "Open Source Friday - varlock - [MM-DD-YYYY]", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        154: {"title": "Open Source Friday - ossf/wg-globalcyberpolicy - 08-15-2025", "assignees": ["KevinCrosby"]},
        155: {"title": "Open Source Friday - Guardrails AI -", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        156: {"title": "Open Source Friday - Mockoon - [MM-DD-YYYY]", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        157: {"title": "Open Source Friday - Letta - [MM-DD-YYYY]", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        158: {"title": "Open Source Friday - Container Use - 10-24-2025", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        159: {"title": "Open Source Friday - Unsloth - [MM-DD-YYYY]", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        160: {"title": "Open Source Friday - Ten Framework - TBD", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        161: {"title": "Open Source Friday - Mautic - TBD", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        163: {"title": "Open Source Friday - E2B - [MM-DD-YYYY]", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        164: {"title": "Open Source Friday - Joplin - [MM-DD-YYYY]", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        165: {"title": "Open Source Friday - [Piscina] - [09-27-2025]", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
        166: {"title": "Open Source Friday - Julia - [MM-DD-YYYY]", "assignees": ["AndreaGriffiths11"]},
        167: {"title": "Open Source Friday - Cilium - 11-21-2025", "assignees": ["AndreaGriffiths11", "LadyKerr"]},
    }
    
    return issues_data

def format_assignees(assignees_list):
    """Format assignees list for display in table."""
    return ", ".join(assignees_list)

def generate_table_row(issue_number, title, assignees):
    """Generate a single table row."""
    assignees_str = format_assignees(assignees)
    link = f"https://github.com/githubevents/open-source-friday/issues/{issue_number}"
    
    # Ensure consistent column widths
    return f"| {issue_number:<12} | {title:<58} | {assignees_str:<42} | {link:<57} |"

def generate_full_table():
    """Generate the complete table for issue #152."""
    issues_data = extract_assignees_from_issue_data()
    
    # Table header
    header = [
        "| Issue Number | Title                                                      | Assignees                                  | Link                                                      |",
        "|--------------|------------------------------------------------------------|--------------------------------------------|-----------------------------------------------------------|"
    ]
    
    # Generate rows for all issues, sorted by issue number
    rows = []
    for issue_num in sorted(issues_data.keys()):
        issue_info = issues_data[issue_num]
        row = generate_table_row(issue_num, issue_info["title"], issue_info["assignees"])
        rows.append(row)
    
    return "\n".join(header + rows)

def main():
    """Main function to generate and print the updated table."""
    print("# Updated Main Table for Open Source Friday Issues")
    print(f"Generated on: {datetime.now().isoformat()}")
    print("\n")
    print(generate_full_table())
    print("\n")
    print("# Summary")
    issues_data = extract_assignees_from_issue_data()
    print(f"Total issues in table: {len(issues_data)}")
    print(f"Issue range: {min(issues_data.keys())} - {max(issues_data.keys())}")
    
    # Find new issues (assuming anything > 157 is new)
    new_issues = [num for num in issues_data.keys() if num > 157]
    if new_issues:
        print(f"New issues added: {', '.join(map(str, sorted(new_issues)))}")

if __name__ == "__main__":
    main()