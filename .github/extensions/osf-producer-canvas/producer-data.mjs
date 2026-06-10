import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Derive the repo root from this file's location:
// producer-data.mjs → osf-producer-canvas → extensions → .github → repo root
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const DEFAULT_REPOSITORY = "githubevents/open-source-friday";
const DEFAULT_DASHBOARD_URL = "https://dash-osf.netlify.app/";
const DEFAULT_WEEKS = 12;
const SCHEDULE_START = "<!-- SCHEDULE_START -->";
const SCHEDULE_END = "<!-- SCHEDULE_END -->";

const HOST_NAMES = new Map([
    ["AndreaGriffiths11", "Andrea Griffiths"],
    ["KevinCrosby", "Kevin Crosby"],
    ["marlenezw", "Marlene Mhangami"],
    ["madebygps", "Gwyneth Pena-Siguenza"],
]);

const BLANK_VALUES = new Set(["", "_NO RESPONSE_", "TBD", "NOT YET", "N/A", "NONE", "NO"]);
const DECISIONS = new Set(["approve", "needs_info", "assign_host", "confirm_date", "schedule", "defer", "done"]);

export function normalizeOpenInput(input = {}) {
    return {
        repository: typeof input.repository === "string" && input.repository ? input.repository : DEFAULT_REPOSITORY,
        dashboardUrl: typeof input.dashboardUrl === "string" && input.dashboardUrl ? input.dashboardUrl : DEFAULT_DASHBOARD_URL,
        weeks: Number.isInteger(input.weeks) ? input.weeks : DEFAULT_WEEKS,
    };
}

export async function buildProducerState(config, workspacePath) {
    const [issueResult, readmeSchedule, savedDecisions] = await Promise.all([
        fetchOpenIssuesSafely(config.repository),
        readScheduleFromReadme(workspacePath),
        readSavedDecisions(config.repository),
    ]);

    const issues = issueResult.issues;
    const issueModels = issues.map(parseIssue);
    const pendingRequests = issueModels.filter((issue) => issue.isPending);
    const pendingWithChecks = await addRepositoryChecks(pendingRequests);
    const reviewedPending = pendingWithChecks.map(addReadiness);
    const readyToApprove = reviewedPending.filter((issue) => issue.readiness.ready);
    const needsMoreInfo = reviewedPending.filter((issue) => !issue.readiness.ready);
    const scheduledIssues = issueModels.filter((issue) => issue.isScheduled);
    const approvedGuests = issueModels.filter((issue) => issue.isApproved);
    const approvedNeedsScheduling = approvedGuests.filter(needsDateHostOrScheduledLabel);
    const schedule = buildSchedule(scheduledIssues, readmeSchedule.rows, config.weeks);
    const producerDecisions = buildProducerDecisions({
        readyToApprove,
        needsMoreInfo,
        approvedNeedsScheduling,
        schedule,
    });

    return {
        generatedAt: new Date().toISOString(),
        repository: config.repository,
        dashboardUrl: config.dashboardUrl,
        summary: "The dashboard shows what exists; this canvas helps decide what happens next.",
        warnings: issueResult.warnings,
        counts: {
            openIssues: issueModels.length,
            pendingRequests: pendingRequests.length,
            readyToApprove: readyToApprove.length,
            needsMoreInfo: needsMoreInfo.length,
            approvedNeedsScheduling: approvedNeedsScheduling.length,
            scheduleGaps: schedule.emptyFridays.length,
            overbookedDates: schedule.overbookedDates.length,
        },
        pendingRequests: reviewedPending,
        readyToApprove,
        needsMoreInfo,
        approvedNeedsScheduling,
        schedule,
        automationOutput: buildAutomationOutput(readmeSchedule, approvedGuests, scheduledIssues),
        producerDecisions,
        savedDecisions,
    };
}

export async function recordDecision(repository, input = {}) {
    const issueNumber = Number(input.issueNumber);
    const decision = String(input.decision || "");
    const note = typeof input.note === "string" ? input.note.trim() : "";

    if (!Number.isInteger(issueNumber) || issueNumber < 1) {
        throw new Error("issueNumber must be a positive integer.");
    }

    if (!DECISIONS.has(decision)) {
        throw new Error("decision must be one of the supported producer decisions.");
    }

    const decisions = await readSavedDecisions(repository);
    decisions[String(issueNumber)] = {
        issueNumber,
        decision,
        note,
        updatedAt: new Date().toISOString(),
    };

    await writeSavedDecisions(repository, decisions);
    return decisions[String(issueNumber)];
}

async function fetchOpenIssues(repository) {
    const issues = [];

    for (let page = 1; page <= 10; page += 1) {
        const url = `https://api.github.com/repos/${repository}/issues?state=open&per_page=100&page=${page}`;
        const batch = await fetchGitHubJson(url);
        const issueBatch = batch.filter((issue) => !issue.pull_request);
        issues.push(...issueBatch);

        if (batch.length < 100) {
            break;
        }
    }

    return issues;
}

async function fetchOpenIssuesSafely(repository) {
    try {
        return {
            issues: await fetchOpenIssues(repository),
            warnings: [],
        };
    } catch (error) {
        return {
            issues: [],
            warnings: [`Could not load GitHub issues: ${error.message}`],
        };
    }
}

async function fetchGitHubJson(url) {
    const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "osf-producer-canvas",
    };
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
        const remaining = response.headers.get("x-ratelimit-remaining");
        if ((response.status === 403 || response.status === 429) && remaining === "0") {
            throw new Error("GitHub rate limit reached. Set GITHUB_TOKEN or GH_TOKEN for authenticated requests.");
        }

        const detail = await response.text();
        throw new Error(`GitHub request failed with ${response.status}: ${detail.slice(0, 240)}`);
    }

    return response.json();
}

function parseIssue(issue) {
    const labels = issue.labels.map((label) => label.name);
    const labelSet = new Set(labels);
    const body = issue.body || "";
    const date = parseIssueDate(parseField(body, "Dates") || parseDateFromTitle(issue.title || ""));
    const host = parseHost(issue.assignees || []);

    return {
        number: issue.number,
        title: issue.title || "",
        url: issue.html_url,
        labels,
        guestName: parseField(body, "Name"),
        githubHandle: parseField(body, "GitHub Handle"),
        about: parseField(body, "Tell us about yourself"),
        projectName: parseField(body, "Project Name"),
        projectRepoUrl: parseField(body, "Project Repo Link"),
        additionalInfo: parseField(body, "Additional Information"),
        dateText: parseField(body, "Dates"),
        dateKey: date ? formatDateKey(date) : "",
        dateDisplay: date ? formatDisplayDate(date) : "",
        assignees: issue.assignees.map((assignee) => assignee.login),
        hostName: host.name,
        hostReason: host.reason,
        isPending: labelSet.has("pending") && !labelSet.has("approved") && !labelSet.has("scheduled"),
        isApproved: labelSet.has("approved"),
        isScheduled: labelSet.has("scheduled"),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        daysOld: Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000),
    };
}

function parseField(body, field) {
    const pattern = new RegExp(`###\\s+${escapeRegExp(field)}\\s*\\n+([\\s\\S]*?)(?=\\n###|$)`);
    const match = body.match(pattern);

    if (!match) {
        return "";
    }

    return cleanValue(match[1]);
}

function cleanValue(value) {
    const text = value
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/^- \[[ xX]\]\s*/gm, "")
        .trim();

    if (BLANK_VALUES.has(text.toUpperCase())) {
        return "";
    }

    return text;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseHost(assignees) {
    if (assignees.length === 1) {
        const login = assignees[0].login;
        return {
            name: HOST_NAMES.get(login) || login,
            reason: "",
        };
    }

    if (assignees.length === 0) {
        return { name: "", reason: "No host is assigned." };
    }

    return {
        name: "",
        reason: "More than one assignee remains, so the host is still TBD.",
    };
}

function parseDateFromTitle(title) {
    const numeric = title.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
    if (numeric) {
        return numeric[1];
    }

    const month = title.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/);
    return month ? month[0] : "";
}

function parseIssueDate(rawDate) {
    const value = cleanValue(rawDate || "");
    if (!value) {
        return null;
    }

    const numeric = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/);
    if (numeric) {
        const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
        return new Date(Date.UTC(Number(year), Number(numeric[1]) - 1, Number(numeric[2])));
    }

    const parsed = new Date(`${value} UTC`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateKey(date) {
    return date.toISOString().slice(0, 10);
}

function formatDisplayDate(date) {
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

async function addRepositoryChecks(issues) {
    const checkedIssues = [];

    for (const issue of issues) {
        checkedIssues.push({
            ...issue,
            repoCheck: await loadRepositoryCheck(issue.projectRepoUrl),
        });
    }

    return checkedIssues;
}

async function loadRepositoryCheck(projectRepoUrl) {
    const parsed = parseGitHubRepository(projectRepoUrl);
    if (!parsed) {
        return {
            passed: false,
            repository: "",
            checks: [],
            reasons: ["Project repo link needs a GitHub owner/repo URL."],
        };
    }

    try {
        const repo = await fetchGitHubJson(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
        const tree = await fetchGitHubJson(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${repo.default_branch}?recursive=1`);
        return buildRepositoryCheck(repo, tree.tree || []);
    } catch (error) {
        return {
            passed: false,
            repository: `${parsed.owner}/${parsed.repo}`,
            checks: [],
            reasons: [`Could not load repository metadata: ${error.message}`],
        };
    }
}

function parseGitHubRepository(value) {
    const text = value.trim().replace(/\.git$/i, "");
    const match = text.match(/github\.com[:/]+([^/\s]+)\/([^/\s#?]+)/i) || text.match(/^([^/\s]+)\/([^/\s#?]+)$/);

    if (!match) {
        return null;
    }

    return {
        owner: match[1],
        repo: match[2],
    };
}

function buildRepositoryCheck(repo, tree) {
    const paths = new Set(tree.map((item) => item.path.toLowerCase()));
    const checks = [
        {
            label: "100+ stars",
            passed: repo.stargazers_count >= 100,
            detail: `${repo.stargazers_count} stars`,
        },
        {
            label: "License",
            passed: Boolean(repo.license) || hasAnyPath(paths, ["license", "license.md", "copying"]),
            detail: repo.license ? repo.license.name : "No license detected",
        },
        {
            label: "Code of conduct",
            passed: hasAnyPath(paths, ["code_of_conduct.md", ".github/code_of_conduct.md", "docs/code_of_conduct.md"]),
            detail: "Required by OSF criteria",
        },
        {
            label: "Contributing guide",
            passed: hasAnyPath(paths, ["contributing.md", ".github/contributing.md", "docs/contributing.md"]),
            detail: "Required by OSF criteria",
        },
    ];
    const reasons = checks.filter((check) => !check.passed).map((check) => `${check.label}: ${check.detail}`);

    return {
        passed: reasons.length === 0,
        repository: repo.full_name,
        url: repo.html_url,
        checks,
        reasons,
    };
}

function hasAnyPath(paths, candidates) {
    return candidates.some((candidate) => paths.has(candidate));
}

function addReadiness(issue) {
    const missing = [];

    if (!issue.guestName) {
        missing.push("Guest name is missing.");
    }
    if (!issue.githubHandle) {
        missing.push("GitHub handle is missing.");
    }
    if (!issue.about) {
        missing.push("Guest background is missing.");
    }
    if (!issue.projectName) {
        missing.push("Project name is missing.");
    }
    if (!issue.projectRepoUrl) {
        missing.push("Project repo link is missing.");
    }

    const reasons = [...missing, ...issue.repoCheck.reasons];

    return {
        ...issue,
        readiness: {
            ready: reasons.length === 0,
            reasons,
        },
    };
}

function needsDateHostOrScheduledLabel(issue) {
    if (!issue.dateKey) {
        return true;
    }
    if (!issue.hostName) {
        return true;
    }
    return !issue.isScheduled;
}

function buildSchedule(scheduledIssues, readmeRows, weeks) {
    const byDate = new Map();

    for (const issue of scheduledIssues) {
        if (!issue.dateKey) {
            continue;
        }
        const issues = byDate.get(issue.dateKey) || [];
        issues.push(issue);
        byDate.set(issue.dateKey, issues);
    }

    const fridays = getUpcomingFridays(weeks);
    const emptyFridays = fridays.filter((friday) => !byDate.has(friday.dateKey));
    const overbookedDates = [...byDate.entries()]
        .filter(([, issues]) => issues.length > 1)
        .map(([dateKey, issues]) => ({
            dateKey,
            dateDisplay: issues[0].dateDisplay || dateKey,
            issues,
        }));

    return {
        weeks,
        readmeRows,
        scheduledIssues,
        emptyFridays,
        overbookedDates,
    };
}

function getUpcomingFridays(weeks) {
    const today = new Date();
    const cursor = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const daysUntilFriday = (5 - cursor.getUTCDay() + 7) % 7;
    cursor.setUTCDate(cursor.getUTCDate() + daysUntilFriday);

    return Array.from({ length: weeks }, (_, index) => {
        const date = new Date(cursor);
        date.setUTCDate(cursor.getUTCDate() + index * 7);
        return {
            dateKey: formatDateKey(date),
            dateDisplay: formatDisplayDate(date),
        };
    });
}

async function readScheduleFromReadme(_workspacePath) {
    const readmePath = path.join(REPO_ROOT, "README.md");

    try {
        const content = await readFile(readmePath, "utf8");
        return {
            rows: parseReadmeRows(content),
            warning: "",
        };
    } catch (error) {
        return {
            rows: [],
            warning: `Could not read README schedule: ${error.message}`,
        };
    }
}

function parseReadmeRows(content) {
    const start = content.indexOf(SCHEDULE_START);
    const end = content.indexOf(SCHEDULE_END);

    if (start === -1 || end === -1 || end <= start) {
        return [];
    }

    const block = content.slice(start + SCHEDULE_START.length, end);
    return block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("|") && !line.includes("----") && !line.includes("Date | Guest"))
        .map(parseReadmeRow)
        .filter(Boolean);
}

function parseReadmeRow(line) {
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells[0] === "") {
        cells.shift();
    }
    if (cells[cells.length - 1] === "") {
        cells.pop();
    }

    if (cells.length < 4) {
        return null;
    }

    const link = cells[1].match(/\[([^\]]+)\]\(([^)]+)\)/);
    return {
        date: cells[0],
        guest: link ? link[1] : cells[1],
        url: link ? link[2] : "",
        project: cells[2],
        host: cells[3],
    };
}

function buildAutomationOutput(readmeSchedule, approvedGuests, scheduledIssues) {
    const scheduledWithoutHost = scheduledIssues.filter((issue) => !issue.hostName).length;
    const approvedAwaitingSchedule = approvedGuests.filter((issue) => !issue.isScheduled).length;

    return [
        {
            name: "Approval notification",
            trigger: "Adding the approved label",
            output: "Comments with the booking link so the guest can pick a Friday.",
            current: `${approvedAwaitingSchedule} approved open issue(s) still need scheduling.`,
        },
        {
            name: "Schedule table update",
            trigger: "scheduled label, issue edit, assign, unassign, Monday cron, or manual run",
            output: "Rebuilds the README upcoming streams table from scheduled issues.",
            current: `${readmeSchedule.rows.length} README schedule row(s) found.`,
            warning: readmeSchedule.warning,
        },
        {
            name: "Guest promo metadata",
            trigger: "Guest promo pipeline for a scheduled issue",
            output: "Writes guest-promo.json. Host stays TBD until exactly one assignee remains.",
            current: `${scheduledWithoutHost} scheduled issue(s) still need one clear host.`,
        },
    ];
}

function buildProducerDecisions(input) {
    const decisions = [];

    for (const issue of input.readyToApprove.slice(0, 8)) {
        decisions.push(decisionFromIssue("Approve", issue, "approve", "Apply the approved label. Automation will send the booking link."));
    }

    for (const issue of input.needsMoreInfo.slice(0, 8)) {
        decisions.push(decisionFromIssue("Request info", issue, "needs_info", issue.readiness.reasons[0]));
    }

    for (const issue of input.approvedNeedsScheduling.slice(0, 8)) {
        const action = issue.dateKey ? "Assign one host and add scheduled if needed." : "Ask the guest to pick a date from the booking calendar.";
        const decision = issue.dateKey ? "assign_host" : "confirm_date";
        decisions.push(decisionFromIssue("Schedule", issue, decision, action));
    }

    for (const gap of input.schedule.emptyFridays.slice(0, 6)) {
        decisions.push({
            category: "Fill gap",
            issueNumber: null,
            title: gap.dateDisplay,
            action: "Pick an approved guest or source a new guest for this Friday.",
            decision: "schedule",
            url: "",
        });
    }

    for (const date of input.schedule.overbookedDates) {
        decisions.push({
            category: "Resolve date collision",
            issueNumber: null,
            title: date.dateDisplay,
            action: `${date.issues.length} scheduled issues share this date. Move one guest or confirm a double booking.`,
            decision: "schedule",
            url: "",
        });
    }

    return decisions;
}

function decisionFromIssue(category, issue, decision, action) {
    return {
        category,
        issueNumber: issue.number,
        title: issue.projectName || issue.title,
        guestName: issue.guestName,
        action,
        decision,
        url: issue.url,
    };
}

async function readSavedDecisions(repository) {
    const filePath = decisionFilePath(repository);

    try {
        const content = await readFile(filePath, "utf8");
        return JSON.parse(content);
    } catch (error) {
        if (error.code === "ENOENT") {
            return {};
        }
        throw error;
    }
}

async function writeSavedDecisions(repository, decisions) {
    const filePath = decisionFilePath(repository);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(decisions, null, 2)}\n`, "utf8");
}

function decisionFilePath(repository) {
    const copilotHome = process.env.COPILOT_HOME || path.join(os.homedir(), ".copilot");
    const safeName = repository.replace(/[^a-zA-Z0-9_.-]+/g, "-");
    return path.join(copilotHome, "extensions", "osf-producer-canvas", "artifacts", `${safeName}-decisions.json`);
}
