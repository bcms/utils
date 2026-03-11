import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function getMcpServer(): McpServer {
    const server = new McpServer({
        name: 'BCMS',
        version: `0.1.1`,
    });
    return server;
}
