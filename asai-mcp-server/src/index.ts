import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { OneDriveClient } from "./onedrive.js";
import { GoogleDriveClient } from "./googledrive.js";
import { TriageEngine } from "./triage.js";
import { getUserConfig } from "./config.js";

import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const server = new Server(
    {
        name: "asai-analytics-mcp",
        version: "1.2.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

const triageEngine = new TriageEngine();

/**
 * Tool Definitions
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_onedrive_files",
                description: "List files from the construction project folders in OneDrive",
                inputSchema: {
                    type: "object",
                    properties: {
                        folderId: { type: "string", description: "Optional folder ID to filter" },
                        userId: { type: "string", description: "The authorized User ID for the request" },
                    },
                },
            },
            {
                name: "triage_document",
                description: "Fetch and triage a specific document from OneDrive",
                inputSchema: {
                    type: "object",
                    properties: {
                        fileId: { type: "string" },
                        fileName: { type: "string" },
                        userId: { type: "string", description: "The authorized User ID for the request" },
                    },
                    required: ["fileId", "fileName"],
                },
            },
            {
                name: "list_gdrive_files",
                description: "List files from Google Drive folders",
                inputSchema: {
                    type: "object",
                    properties: {
                        folderId: { type: "string", description: "Optional Google Drive folder ID" },
                        userId: { type: "string", description: "The authorized User ID for the request" },
                    },
                },
            },
            {
                name: "triage_gdrive_document",
                description: "Fetch and triage a specific document from Google Drive",
                inputSchema: {
                    type: "object",
                    properties: {
                        fileId: { type: "string" },
                        fileName: { type: "string" },
                        userId: { type: "string", description: "The authorized User ID for the request" },
                    },
                    required: ["fileId", "fileName"],
                },
            },
        ],
    };
});


/**
 * Handle Tool Calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const userId = args?.userId as string | undefined;

    try {
        const config = await getUserConfig(userId);

        if (name === "list_onedrive_files") {
            const onedrive = new OneDriveClient(config.microsoft!);
            const files = await onedrive.listFiles((args?.folderId as string) || "root");
            return {
                content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
            };
        }

        if (name === "triage_document") {
            const fileId = args?.fileId as string;
            const fileName = args?.fileName as string;
            const onedrive = new OneDriveClient(config.microsoft!);

            const content = await onedrive.getFileContent(fileId);
            const snippet = content.toString().substring(0, 1000);

            const result = await triageEngine.triage(fileName, snippet, config.geminiApiKey);

            return {
                content: [{
                    type: "text",
                    text: `Triage complete for ${fileName}:\n` +
                        `- Client: ${result.client || 'N/A'}\n` +
                        `- Product: ${result.product || 'N/A'}\n` +
                        `- Domain: ${result.domain || 'N/A'}\n` +
                        `- Confidence: ${(result.confidence * 100).toFixed(1)}%`
                }],
            };
        }

        if (name === "list_gdrive_files") {
            const gdrive = new GoogleDriveClient(config.google!);
            const files = await gdrive.listFiles((args?.folderId as string) || undefined);
            return {
                content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
            };
        }

        if (name === "triage_gdrive_document") {
            const fileId = args?.fileId as string;
            const fileName = args?.fileName as string;

            const gdrive = new GoogleDriveClient(config.google!);
            const content = await gdrive.getFileContent(fileId);
            const snippet = content.slice(0, 1000).toString();

            const result = await triageEngine.triage(fileName, snippet, config.geminiApiKey);

            return {
                content: [{
                    type: "text",
                    text: `Triage complete for Google Drive file ${fileName}:\n` +
                        `- Client: ${result.client || 'N/A'}\n` +
                        `- Product: ${result.product || 'N/A'}\n` +
                        `- Domain: ${result.domain || 'N/A'}\n` +
                        `- Confidence: ${(result.confidence * 100).toFixed(1)}%`
                }],
            };
        }

        throw new Error(`Tool ${name} not found`);
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
});

app.post("/messages", async (req, res) => {
    if (transport) {
        await transport.handlePostMessage(req, res);
    } else {
        res.status(400).send("No active SSE connection");
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.error(`Asai Analytics MCP Server running on port ${PORT}`);

    // Start background sync loop
    startSyncLoop();
});

/**
 * Background Sync Logic
 * Periodically checks for new files and triages them
 */
async function startSyncLoop() {
    console.error("Starting Background Sync Engine...");

    // Run sync every 5 minutes
    const SYNC_INTERVAL = 5 * 60 * 1000;

    while (true) {
        try {
            console.error("\n--- Starting Global Sync Cycle ---");
            const { db } = await import("./config.js");
            const snapshot = await db.collection('userConfigs').get();

            for (const d of snapshot.docs) {
                const userId = d.id;
                const config = d.data();

                if (config.googleClientId && config.googleRefreshToken) {
                    await syncUserDrive(userId, config);
                }
            }
            console.error("--- Sync Cycle Complete ---");
        } catch (error) {
            console.error("Error in sync loop:", error);
        }

        await new Promise(resolve => setTimeout(resolve, SYNC_INTERVAL));
    }
}

async function syncUserDrive(userId: string, config: any) {
    try {
        const { db } = await import("./config.js");
        const gdrive = new GoogleDriveClient({
            clientId: config.googleClientId,
            clientSecret: config.googleClientSecret,
            refreshToken: config.googleRefreshToken,
            redirectUri: config.googleRedirectUri || 'https://developers.google.com/oauthplayground'
        });

        const files = await gdrive.listFiles(config.googleFolderId);
        if (!files || files.length === 0) return;

        for (const file of files) {
            // Check if already indexed
            const dupSnap = await db.collection('documents')
                .where('metadata.fileName', '==', file.name)
                .where('metadata.userId', '==', userId)
                .limit(1)
                .get();

            if (!dupSnap.empty) continue;

            console.error(`Syncing new file: ${file.name}`);
            const content = await gdrive.getFileContent(file.id);
            const snippet = content.slice(0, 1000).toString();

            const result = await triageEngine.triage(file.name, snippet, config.geminiApiKey || process.env.GEMINI_API_KEY);

            // Index to Firestore
            await db.collection('documents').add({
                text: snippet,
                metadata: {
                    fileName: file.name,
                    client: result.client,
                    product: result.product,
                    domain: result.domain,
                    userId: userId,
                    source: 'googledrive'
                },
                indexedAt: new Date()
            });

            // Log Activity
            await db.collection('activities').add({
                type: 'sync',
                title: 'Cloud Sync Engine:',
                details: `Processed '${file.name}' from Google Drive.`,
                status: 'Complete',
                timestamp: new Date(),
                icon: '☁️'
            });
        }
    } catch (error) {
        console.error(`Sync error for user ${userId}:`, error);
    }
}
