import { createServer } from "node:http";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";
import { buildProducerState, normalizeOpenInput, recordDecision } from "./producer-data.mjs";
import { renderHtml } from "./renderer.mjs";

const servers = new Map();
let workspacePath = process.cwd();

function getWorkspacePath() {
    return workspacePath || process.cwd();
}

function writeJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(payload));
}

async function readJson(req) {
    const chunks = [];
    let size = 0;

    for await (const chunk of req) {
        size += chunk.length;
        if (size > 64 * 1024) {
            throw new Error("Request body is too large.");
        }
        chunks.push(chunk);
    }

    const body = Buffer.concat(chunks).toString("utf8").trim();
    return body ? JSON.parse(body) : {};
}

async function handleRequest(req, res, entry) {
    const url = new URL(req.url || "/", "http://127.0.0.1");

    if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
        });
        res.end(renderHtml());
        return;
    }

    if (req.method === "GET" && url.pathname === "/state") {
        const state = await buildProducerState(entry.config, getWorkspacePath());
        writeJson(res, 200, state);
        return;
    }

    if (req.method === "POST" && url.pathname === "/decision") {
        const input = await readJson(req);
        const decision = await recordDecision(entry.config.repository, input);
        writeJson(res, 200, decision);
        return;
    }

    writeJson(res, 404, { error: "Not found." });
}

async function startServer(entry) {
    const server = createServer((req, res) => {
        handleRequest(req, res, entry).catch((error) => {
            writeJson(res, 500, { error: error.message });
        });
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    entry.server = server;
    entry.url = `http://127.0.0.1:${port}/`;
}

const producerCanvas = createCanvas({
    id: "osf-producer",
    displayName: "Open Source Friday Producer",
    description: "Reviews Open Source Friday guest requests and recommends the next producer action.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            repository: {
                type: "string",
                description: "GitHub repository in owner/name form.",
                default: "githubevents/open-source-friday",
            },
            dashboardUrl: {
                type: "string",
                description: "Existing dashboard URL for source data review.",
                default: "https://dash-osf.netlify.app/",
            },
            weeks: {
                type: "integer",
                minimum: 4,
                maximum: 26,
                description: "Number of upcoming Fridays to scan for schedule gaps.",
                default: 12,
            },
        },
    },
    actions: [
        {
            name: "get_snapshot",
            description: "Returns the current producer snapshot, including pending requests, schedule gaps, automation output, and decisions.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    repository: { type: "string" },
                    dashboardUrl: { type: "string" },
                    weeks: { type: "integer", minimum: 4, maximum: 26 },
                },
            },
            handler: async (ctx) => {
                const config = normalizeOpenInput(ctx.input);
                try {
                    return await buildProducerState(config, getWorkspacePath());
                } catch (error) {
                    throw new CanvasError("producer_snapshot_failed", error.message);
                }
            },
        },
        {
            name: "record_decision",
            description: "Records a producer decision for one Open Source Friday issue in local extension storage.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                required: ["issueNumber", "decision"],
                properties: {
                    repository: { type: "string" },
                    issueNumber: { type: "integer", minimum: 1 },
                    decision: {
                        type: "string",
                        enum: ["approve", "needs_info", "assign_host", "confirm_date", "schedule", "defer", "done"],
                    },
                    note: { type: "string" },
                },
            },
            handler: async (ctx) => {
                try {
                    const config = normalizeOpenInput(ctx.input);
                    return await recordDecision(config.repository, ctx.input);
                } catch (error) {
                    throw new CanvasError("producer_decision_failed", error.message);
                }
            },
        },
    ],
    open: async (ctx) => {
        const config = normalizeOpenInput(ctx.input);
        let entry = servers.get(ctx.instanceId);

        if (!entry) {
            entry = { config, server: null, url: "" };
            await startServer(entry);
            servers.set(ctx.instanceId, entry);
        }

        entry.config = config;
        return {
            title: "Open Source Friday Producer",
            status: "Producer decisions",
            url: entry.url,
        };
    },
    onClose: async (ctx) => {
        const entry = servers.get(ctx.instanceId);
        if (!entry) {
            return;
        }

        servers.delete(ctx.instanceId);
        await new Promise((resolve) => entry.server.close(() => resolve()));
    },
});

const session = await joinSession({
    canvases: [producerCanvas],
});

workspacePath = session.workspacePath || process.cwd();
