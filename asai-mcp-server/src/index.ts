import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Asai Analytics MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
