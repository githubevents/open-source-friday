export function renderHtml() {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Open Source Friday Producer</title>
    <style>
        :root {
            color-scheme: light dark;
        }

        body {
            margin: 0;
            background: var(--background-color-default, #ffffff);
            color: var(--text-color-default, #1f2328);
            font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
            font-size: var(--text-body-medium, 14px);
            line-height: var(--leading-body-medium, 20px);
        }

        a {
            color: var(--true-color-blue, #0969da);
        }

        button,
        select,
        textarea {
            font: inherit;
        }

        .shell {
            padding: 24px;
            max-width: 1280px;
            margin: 0 auto;
        }

        .topbar {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
        }

        h1,
        h2,
        h3 {
            margin: 0;
            font-weight: var(--font-weight-semibold, 600);
        }

        h1 {
            font-size: var(--text-title-large, 26px);
            line-height: var(--leading-title-large, 32px);
        }

        h2 {
            font-size: var(--text-title-medium, 20px);
            line-height: var(--leading-title-medium, 26px);
        }

        h3 {
            font-size: var(--text-body-large, 16px);
            line-height: var(--leading-body-large, 22px);
        }

        .muted {
            color: var(--text-color-muted, #656d76);
        }

        .button {
            border: 1px solid var(--border-color-default, #d0d7de);
            border-radius: 8px;
            background: var(--background-color-default, #ffffff);
            color: var(--text-color-default, #1f2328);
            padding: 8px 12px;
            cursor: pointer;
            text-decoration: none;
        }

        .button.primary {
            background: var(--true-color-blue, #0969da);
            border-color: var(--true-color-blue, #0969da);
            color: var(--color-white, #ffffff);
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }

        .metric,
        .panel,
        .card {
            border: 1px solid var(--border-color-default, #d0d7de);
            background: var(--background-color-muted, rgba(175, 184, 193, 0.08));
            border-radius: 12px;
        }

        .metric {
            padding: 14px;
        }

        .metric strong {
            display: block;
            font-size: 26px;
            line-height: 32px;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 16px;
        }

        .panel {
            padding: 16px;
            min-width: 0;
        }

        .panel-header {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
        }

        .stack {
            display: grid;
            gap: 10px;
        }

        .card {
            padding: 12px;
            background: var(--background-color-default, #ffffff);
        }

        .card-title {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 8px;
        }

        .pill-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 8px 0;
        }

        .pill {
            border: 1px solid var(--border-color-default, #d0d7de);
            border-radius: 999px;
            color: var(--text-color-muted, #656d76);
            padding: 2px 8px;
            font-size: 12px;
        }

        .pill.good {
            color: var(--true-color-green, #1a7f37);
            border-color: var(--true-color-green-muted, #4ac26b);
        }

        .pill.warn {
            color: var(--true-color-red, #cf222e);
            border-color: var(--true-color-red-muted, #ff8182);
        }

        .metric.alert strong { color: var(--true-color-red, #cf222e); }
        .metric.success strong { color: var(--true-color-green, #1a7f37); }
        .metric.caution strong { color: #9a6700; }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        .loading-pulse {
            animation: pulse 1.4s ease-in-out infinite;
            color: var(--text-color-muted, #656d76);
            padding: 40px;
            text-align: center;
        }

        .decisions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 14px;
        }

        .decision-group {
            display: grid;
            gap: 8px;
            align-content: start;
        }

        .decision-group-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: var(--font-weight-semibold, 600);
            font-size: var(--text-body-large, 16px);
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color-default, #d0d7de);
        }

        .details {
            margin: 8px 0 0;
            padding-left: 18px;
        }

        .decision-controls {
            display: grid;
            gap: 8px;
            margin-top: 10px;
        }

        .decision-controls textarea {
            min-height: 58px;
            resize: vertical;
            border: 1px solid var(--border-color-default, #d0d7de);
            border-radius: 8px;
            padding: 8px;
            background: var(--background-color-default, #ffffff);
            color: var(--text-color-default, #1f2328);
        }

        .decision-row {
            display: flex;
            gap: 8px;
        }

        .decision-row select {
            flex: 1;
            border: 1px solid var(--border-color-default, #d0d7de);
            border-radius: 8px;
            padding: 7px;
            background: var(--background-color-default, #ffffff);
            color: var(--text-color-default, #1f2328);
        }

        .summary {
            margin-top: 18px;
            padding: 16px;
            border-left: 4px solid var(--true-color-blue, #0969da);
            background: var(--true-color-blue-muted, rgba(84, 174, 255, 0.16));
            border-radius: 8px;
        }

        .error {
            padding: 16px;
            border: 1px solid var(--true-color-red-muted, #ff8182);
            border-radius: 8px;
            color: var(--true-color-red, #cf222e);
        }
    </style>
</head>
<body>
    <main class="shell">
        <div class="topbar">
            <div>
                <h1>Open Source Friday Producer</h1>
                <p class="muted">Turn guest request data into next producer actions.</p>
            </div>
            <div class="actions">
                <a id="dashboardLink" class="button" href="https://dash-osf.netlify.app/" target="_blank" rel="noreferrer">Open dashboard</a>
                <button id="refreshButton" class="button primary" type="button">Refresh</button>
            </div>
        </div>
        <p id="status" class="muted">Loading producer snapshot...</p>
        <div id="app"></div>
    </main>
    <script>
        const app = document.getElementById("app");
        const status = document.getElementById("status");
        const refreshButton = document.getElementById("refreshButton");
        const dashboardLink = document.getElementById("dashboardLink");
        let currentState = null;

        refreshButton.addEventListener("click", loadState);
        loadState();

        async function loadState() {
            status.textContent = "Loading producer snapshot...";
            app.innerHTML = '<div class="loading-pulse">Fetching issues from GitHub…</div>';

            try {
                const response = await fetch("/state", { cache: "no-store" });
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.error || "Could not load producer snapshot.");
                }

                currentState = payload;
                dashboardLink.href = payload.dashboardUrl;
                status.textContent = "Updated " + formatDateTime(payload.generatedAt) + " from " + payload.repository + ".";
                render(payload);
            } catch (error) {
                status.textContent = "";
                app.innerHTML = '<div class="error">' + escapeHtml(error.message) + '</div>';
            }
        }

        function render(state) {
            app.innerHTML =
                renderMetrics(state.counts) +
                renderWarnings(state.warnings) +
                renderProducerDecisions(state.producerDecisions) +
                '<div class="grid">' +
                    renderPending(state.needsMoreInfo) +
                    renderReady(state.readyToApprove) +
                    renderApprovedNeedsScheduling(state.approvedNeedsScheduling) +
                    renderUpcomingSchedule(state.schedule) +
                    renderScheduleGaps(state.schedule) +
                    renderAutomation(state.automationOutput) +
                '</div>' +
                "";

            bindDecisionControls();
        }

        function renderMetrics(counts) {
            return '<section class="metrics">' +
                metric("Pending", counts.pendingRequests, "") +
                metric("Ready to approve", counts.readyToApprove, counts.readyToApprove > 0 ? "success" : "") +
                metric("Need info", counts.needsMoreInfo, counts.needsMoreInfo > 0 ? "caution" : "success") +
                metric("Approved needs scheduling", counts.approvedNeedsScheduling, counts.approvedNeedsScheduling > 0 ? "caution" : "") +
                metric("Schedule gaps", counts.scheduleGaps, counts.scheduleGaps > 3 ? "caution" : counts.scheduleGaps === 0 ? "success" : "") +
                metric("Overbooked dates", counts.overbookedDates, counts.overbookedDates > 0 ? "alert" : "success") +
            '</section>';
        }

        function metric(label, value, modifier) {
            const cls = modifier ? " " + modifier : "";
            return '<div class="metric' + cls + '"><strong>' + escapeHtml(value) + '</strong><span class="muted">' + escapeHtml(label) + '</span></div>';
        }

        function renderWarnings(warnings) {
            if (!warnings || warnings.length === 0) {
                return "";
            }

            return '<section class="summary">' +
                '<strong>Data warning:</strong>' +
                '<ul class="details">' + warnings.map(function (warning) {
                    return '<li>' + escapeHtml(warning) + '</li>';
                }).join("") + '</ul>' +
            '</section>';
        }

        function renderPending(items) {
            return panel("Pending requests", "Needs more info before approval", renderIssueList(items, "needs_info"));
        }

        function renderReady(items) {
            return panel("Ready-to-approve guests", "Complete form and repo criteria", renderIssueList(items, "approve"));
        }

        function renderApprovedNeedsScheduling(items) {
            return panel("Approved guests needing date or host", "Approved, but not producer-ready yet", renderIssueList(items, "assign_host"));
        }

        function renderUpcomingSchedule(schedule) {
            if (schedule.readmeRows.length === 0) {
                return panel("Upcoming schedule", "From README.md", '<div class="card"><p class="muted">No upcoming rows found in README.md.</p></div>');
            }

            const rows = schedule.readmeRows.map(function (row) {
                return '<div class="card"><div class="card-title"><h3>' + escapeHtml(row.date) + '</h3><span class="pill">' + escapeHtml(row.host) + '</span></div>' +
                    '<p><a href="' + safeUrl(row.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(row.guest) + '</a></p>' +
                    '<p class="muted">' + escapeHtml(row.project) + '</p></div>';
            }).join("");

            return panel("Upcoming schedule", "Next " + schedule.readmeRows.length + " stream(s) from README.md", rows);
        }

        function renderScheduleGaps(schedule) {
            const collisions = schedule.overbookedDates.map(function (date) {
                const links = date.issues.map(function (issue) {
                    return '<a href="' + safeUrl(issue.url) + '" target="_blank" rel="noreferrer">#' + escapeHtml(issue.number) + ' ' + escapeHtml(issue.projectName || issue.title) + '</a>';
                }).join(" · ");
                return '<div class="card"><div class="card-title"><h3>' + escapeHtml(date.dateDisplay) + '</h3><span class="pill warn">Collision</span></div><p class="muted">' + links + '</p></div>';
            }).join("");

            const gaps = schedule.emptyFridays.slice(0, 8).map(function (gap) {
                return '<div class="card"><div class="card-title"><h3>' + escapeHtml(gap.dateDisplay) + '</h3><span class="pill warn">Gap</span></div><p class="muted">No guest scheduled.</p></div>';
            }).join("");

            const body = collisions + gaps || '<div class="card"><p class="muted">No gaps or collisions — schedule looks solid.</p></div>';
            return panel("Gaps & collisions", "Next " + schedule.weeks + " weeks", body);
        }

        function renderAutomation(items) {
            const body = items.map(function (item) {
                const warning = item.warning ? '<p class="pill warn">' + escapeHtml(item.warning) + '</p>' : "";
                return '<div class="card"><h3>' + escapeHtml(item.name) + '</h3>' +
                    '<p><strong>Trigger:</strong> ' + escapeHtml(item.trigger) + '</p>' +
                    '<p><strong>Output:</strong> ' + escapeHtml(item.output) + '</p>' +
                    '<p class="muted">' + escapeHtml(item.current) + '</p>' + warning + '</div>';
            }).join("");

            return panel("Automation output", "What labels and workflows will do next", body);
        }

        function renderProducerDecisions(items) {
            if (items.length === 0) {
                return '<section class="panel" style="margin-bottom:16px"><div class="panel-header"><div><h2>Producer decisions</h2><p class="muted">Nothing urgent right now.</p></div></div></section>';
            }

            const byCategory = new Map();
            for (const item of items) {
                const list = byCategory.get(item.category) || [];
                list.push(item);
                byCategory.set(item.category, list);
            }

            const groups = [...byCategory.entries()].map(function (pair) {
                const category = pair[0];
                const catItems = pair[1];
                const cards = catItems.map(function (item) {
                    const link = item.url ? '<a href="' + safeUrl(item.url) + '" target="_blank" rel="noreferrer">#' + escapeHtml(item.issueNumber) + '</a> ' : "";
                    const who = item.guestName ? ' <span class="muted">— ' + escapeHtml(item.guestName) + '</span>' : "";
                    return '<div class="card">' +
                        '<p>' + link + '<strong>' + escapeHtml(item.title || "") + '</strong>' + who + '</p>' +
                        '<p class="muted">' + escapeHtml(item.action) + '</p>' +
                    '</div>';
                }).join("");
                return '<div class="decision-group">' +
                    '<div class="decision-group-header"><span>' + escapeHtml(category) + '</span><span class="pill">' + escapeHtml(catItems.length) + '</span></div>' +
                    cards +
                '</div>';
            }).join("");

            const catCount = byCategory.size;
            return '<section class="panel" style="margin-bottom:16px">' +
                '<div class="panel-header"><div><h2>Producer decisions</h2><p class="muted">' + escapeHtml(items.length) + ' item(s) across ' + escapeHtml(catCount) + ' categor' + (catCount === 1 ? 'y' : 'ies') + '</p></div></div>' +
                '<div class="decisions-grid">' + groups + '</div>' +
            '</section>';
        }

        function renderIssueList(items, suggestedDecision) {
            const body = items.map(function (issue) {
                return renderIssue(issue, suggestedDecision);
            }).join("");

            return emptyMessage(body, "Nothing in this bucket.");
        }

        function renderIssue(issue, suggestedDecision) {
            const saved = currentState.savedDecisions[String(issue.number)] || {};
            const decision = saved.decision || suggestedDecision;
            const ageTag = issue.daysOld != null ? ' <span class="pill" title="Days since submission">' + escapeHtml(issue.daysOld) + 'd</span>' : "";
            const reasons = issue.readiness && issue.readiness.reasons.length
                ? '<ul class="details">' + issue.readiness.reasons.map(function (reason) {
                    return '<li>' + escapeHtml(reason) + '</li>';
                }).join("") + '</ul>'
                : "";
            const checks = issue.repoCheck && issue.repoCheck.checks
                ? '<div class="pill-row">' + issue.repoCheck.checks.map(function (check) {
                    return '<span class="pill ' + (check.passed ? "good" : "warn") + '">' + escapeHtml(check.label) + '</span>';
                }).join("") + '</div>'
                : "";

            return '<article class="card">' +
                '<div class="card-title"><h3>' + escapeHtml(issue.projectName || issue.title) + ageTag + '</h3><a href="' + safeUrl(issue.url) + '" target="_blank" rel="noreferrer">#' + escapeHtml(issue.number) + '</a></div>' +
                '<p><strong>Guest:</strong> ' + escapeHtml(issue.guestName || "TBD") + '</p>' +
                '<p><strong>Date:</strong> ' + escapeHtml(issue.dateDisplay || "TBD") + '</p>' +
                '<p><strong>Host:</strong> ' + escapeHtml(issue.hostName || "TBD") + '</p>' +
                renderLabels(issue.labels) +
                checks +
                reasons +
                renderDecisionControls(issue.number, decision, saved.note || "") +
            '</article>';
        }

        function renderLabels(labels) {
            return '<div class="pill-row">' + labels.map(function (label) {
                return '<span class="pill">' + escapeHtml(label) + '</span>';
            }).join("") + '</div>';
        }

        function renderDecisionControls(issueNumber, decision, note) {
            return '<div class="decision-controls">' +
                '<textarea data-note="' + escapeHtml(issueNumber) + '" placeholder="Producer note">' + escapeHtml(note) + '</textarea>' +
                '<div class="decision-row">' +
                    '<select data-select="' + escapeHtml(issueNumber) + '">' +
                        decisionOption("approve", "Approve", decision) +
                        decisionOption("needs_info", "Needs info", decision) +
                        decisionOption("assign_host", "Assign host", decision) +
                        decisionOption("confirm_date", "Confirm date", decision) +
                        decisionOption("schedule", "Schedule", decision) +
                        decisionOption("defer", "Defer", decision) +
                        decisionOption("done", "Done", decision) +
                    '</select>' +
                    '<button class="button" type="button" data-save="' + escapeHtml(issueNumber) + '">Save</button>' +
                '</div>' +
            '</div>';
        }

        function decisionOption(value, label, selected) {
            const selectedText = value === selected ? " selected" : "";
            return '<option value="' + escapeHtml(value) + '"' + selectedText + '>' + escapeHtml(label) + '</option>';
        }

        function bindDecisionControls() {
            document.querySelectorAll("[data-save]").forEach(function (button) {
                button.addEventListener("click", async function () {
                    const issueNumber = Number(button.getAttribute("data-save"));
                    const select = document.querySelector('[data-select="' + issueNumber + '"]');
                    const note = document.querySelector('[data-note="' + issueNumber + '"]');

                    button.textContent = "Saving...";
                    button.disabled = true;

                    try {
                        const response = await fetch("/decision", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                issueNumber: issueNumber,
                                decision: select.value,
                                note: note.value,
                            }),
                        });
                        const payload = await response.json();
                        if (!response.ok) {
                            throw new Error(payload.error || "Could not save decision.");
                        }
                        await new Promise(function (r) { setTimeout(r, 50); });
                        button.textContent = "Saved ✓";
                        await new Promise(function (r) { setTimeout(r, 600); });
                        await loadState();
                    } catch (error) {
                        button.textContent = "Save";
                        button.disabled = false;
                        alert(error.message);
                    }
                });
            });
        }

        function panel(title, subtitle, body) {
            return '<section class="panel"><div class="panel-header"><div><h2>' + escapeHtml(title) + '</h2><p class="muted">' + escapeHtml(subtitle) + '</p></div></div><div class="stack">' + body + '</div></section>';
        }

        function emptyMessage(body, message) {
            return body || '<div class="card"><p class="muted">' + escapeHtml(message) + '</p></div>';
        }

        function formatDateTime(value) {
            return new Date(value).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
            });
        }

        function safeUrl(value) {
            const text = String(value || "");
            return text.startsWith("http://") || text.startsWith("https://") ? escapeHtml(text) : "#";
        }

        function escapeHtml(value) {
            return String(value ?? "").replace(/[&<>"']/g, function (char) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                }[char];
            });
        }
    </script>
</body>
</html>`;
}
