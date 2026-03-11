import Fastify from 'fastify';
import FastifyCors from '@fastify/cors';
import FastifyMcpServer from 'fastify-mcp-server';
import { getMcpServer } from '@thebcms/mcp/server';
import { getBcmsClient } from '@thebcms/mcp/bcms-client';
import { createGeneratedTools } from '@thebcms/mcp/tools/generated';

async function main() {
    const fastify = Fastify({
        logger: true,
    });
    const bcms = getBcmsClient();
    const genTools = await createGeneratedTools(bcms);
    const mcps = getMcpServer();
    genTools(mcps);
    await fastify.register(FastifyCors, {});
    await fastify.register(FastifyMcpServer, {
        endpoint: '/mcp',
        createMcpServer() {
            // If query.projectId === 1, do something else
            const mcpServer = getMcpServer();
            genTools(mcpServer);
            return mcpServer;
        },
    });

    fastify.listen(
        {
            port: 8082,
            host: '0.0.0.0',
        },
        (err, address) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.debug('MCP server is running on:', address);
        },
    );
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
