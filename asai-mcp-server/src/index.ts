import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { OneDriveClient } from "./onedrive.js";
import { TriageEngine } from "./triage.js";
import * as dotenv from "dotenv";

dotenv.config();

const server = new Server(
    {
        name: "asai-analytics-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

const onedrive = new OneDriveClient();
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

    try {
        if (name === "list_onedrive_files") {
            const files = await onedrive.listFiles((args?.folderId as string) || "root");
            return {
                content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
            };
        }

        if (name === "triage_document") {
            const fileId = args?.fileId as string;
            const fileName = args?.fileName as string;

            const content = await onedrive.getFileContent(fileId);
            const snippet = content.toString().substring(0, 1000);

            const result = await triageEngine.triage(fileName, snippet);

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
