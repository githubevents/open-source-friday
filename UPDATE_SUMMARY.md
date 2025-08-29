# Open Source Friday Main Table Update

This repository contains the tools and updated content to maintain the main tracking table for Open Source Friday guest issues.

## What Was Updated

The main tracking table in [Issue #152](https://github.com/githubevents/open-source-friday/issues/152) has been updated to include new guest issues that were created since the last update.

### New Issues Added (9 total)

- **Issue 158**: Open Source Friday - Container Use - 10-24-2025 (AndreaGriffiths11, LadyKerr)
- **Issue 159**: Open Source Friday - Unsloth - [MM-DD-YYYY] (AndreaGriffiths11, LadyKerr)
- **Issue 160**: Open Source Friday - Ten Framework - TBD (AndreaGriffiths11, LadyKerr)
- **Issue 161**: Open Source Friday - Mautic - TBD (AndreaGriffiths11, LadyKerr)
- **Issue 163**: Open Source Friday - E2B - [MM-DD-YYYY] (AndreaGriffiths11, LadyKerr)
- **Issue 164**: Open Source Friday - Joplin - [MM-DD-YYYY] (AndreaGriffiths11, LadyKerr)
- **Issue 165**: Open Source Friday - [Piscina] - [09-27-2025] (AndreaGriffiths11, LadyKerr)
- **Issue 166**: Open Source Friday - Julia - [MM-DD-YYYY] (AndreaGriffiths11)
- **Issue 167**: Open Source Friday - Cilium - 11-21-2025 (AndreaGriffiths11, LadyKerr)

*Note: Issue 162 was not included as it appears to be missing or closed.*

## Files Created

### `ISSUE_152_UPDATE.md`
Contains the complete updated table content that should replace the current table in Issue #152. This includes:
- The original table rows (issues 142-157)
- All new issues (158-167, excluding 162)
- Proper formatting for GitHub markdown tables
- Clear instructions for manual update

### `scripts/update_main_table.py`
A Python script that can be used to regenerate the table automatically. Features:
- Extracts issue data and assignee information
- Formats the table with consistent column widths
- Provides summary statistics
- Can be extended to pull data directly from GitHub API

### `updated_table.md`
The raw table content in markdown format, ready to copy-paste.

## How to Update Issue #152

Since direct API access to update the GitHub issue is not available, the table needs to be updated manually:

1. Navigate to https://github.com/githubevents/open-source-friday/issues/152
2. Click the "Edit" button on the issue body
3. Replace the entire table content with the table from `ISSUE_152_UPDATE.md`
4. Save the changes

## Summary

- **Previous table**: 12 issues (142-157)
- **Updated table**: 21 issues (142-167, excluding 162)
- **New issues added**: 9 issues
- **Total update**: Added comprehensive tracking for all recent Open Source Friday guest submissions

The table now provides complete tracking for all open Open Source Friday guest issues and their assigned maintainers.