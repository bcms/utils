import type { Client } from '@thebcms/client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import z from 'zod';
import { createZodEntrySchema } from '@thebcms/mcp/utils/schema';
import { createEntryInputSchema } from '@thebcms/mcp/utils/entry-schema';
import { AxiosError } from 'axios';

interface ListTemplatesOutputEntryInfo {
    lng: string;
    title: string;
    slug: string;
}
interface ListTemplatesOutputEntry {
    _id: string;
    info: ListTemplatesOutputEntryInfo[];
}
interface ListTemplatesOutputTemplate {
    _id: string;
    name: string;
    slug: string;
    entries: ListTemplatesOutputEntry[];
}
interface ListTemplatesOutput {
    templates: ListTemplatesOutputTemplate[];
}
const listTemplatesOutputSchema = z.object({
    templates: z.array(
        z.object({
            _id: z.string(),
            name: z.string(),
            slug: z.string(),
            entries: z.array(
                z.object({
                    _id: z.string(),
                    info: z.array(
                        z.object({
                            lng: z.string(),
                            title: z.string(),
                            slug: z.string(),
                        }),
                    ),
                }),
            ),
        }),
    ),
});

async function generateListOutput(bcms: Client): Promise<ListTemplatesOutput> {
    const templates = await bcms.template.getAll();
    const listTemplatesOutput: ListTemplatesOutput = {
        templates: [],
    };
    for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const entries = await bcms.entry.getAllLite(template._id);
        const listOutput: ListTemplatesOutputTemplate = {
            _id: template._id,
            name: template.label,
            slug: template.name,
            entries: [],
        };
        for (let j = 0; j < entries.length; j++) {
            const entry = entries[j];
            listOutput.entries.push({
                _id: entry._id,
                info: entry.info.map((info) => {
                    return {
                        lng: info.lng,
                        title: info.title,
                        slug: info.slug,
                    };
                }),
            });
        }
        listTemplatesOutput.templates.push(listOutput);
    }
    return listTemplatesOutput;
}

export async function createGeneratedTools(
    bcms: Client,
): Promise<(server: McpServer) => void> {
    let listOutput = await generateListOutput(bcms);
    const entryTools: Array<(server: McpServer) => void> = [];

    bcms.socket.register('entry', async (_data) => {
        listOutput = await generateListOutput(bcms);
    });

    const templates = await bcms.template.getAll();
    const groups = await bcms.group.getAll();
    const widgets = await bcms.widget.getAll();
    const languages = await bcms.language.getAll();
    const statuses = await bcms.entryStatus.getAll();
    for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        entryTools.push((server) => {
            server.registerTool(
                `list_entries_for_template_${template._id}_${template.name}`,
                {
                    description: `List all entries for the template "${template.label}". This tool should be called when you want get data for entries in this template.`,
                    inputSchema: z.object({
                        templateId: z
                            .string()
                            .describe(
                                'The ID of the template to list entries for',
                            ),
                    }),
                    outputSchema: z.object({
                        data: z.array(
                            createZodEntrySchema(
                                template,
                                templates,
                                groups,
                                widgets,
                                languages,
                            ),
                        ),
                    }),
                },
                async (args) => {
                    const entries = await bcms.entry.getAll(args.templateId);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(entries),
                            },
                        ],
                        structuredContent: {
                            data: entries,
                        },
                    };
                },
            );
            server.registerTool(
                `create_entry_for_template_${template._id}_${template.name}`,
                {
                    description: `Create a new entry for the template "${template.label}". This tool should be called when you want to create a new entry for this template.`,
                    inputSchema: createEntryInputSchema(
                        template,
                        groups,
                        widgets,
                        languages,
                        statuses,
                    ),
                    outputSchema: z.object({
                        data: createZodEntrySchema(
                            template,
                            templates,
                            groups,
                            widgets,
                            languages,
                        ),
                    }),
                },
                async (args) => {
                    console.log('Creating entry with args:', args);
                    try {
                        const entryRaw = await bcms.entry.create(
                            template._id,
                            args as any,
                        );
                        const entry = await bcms.entry.getById(
                            entryRaw._id,
                            template._id,
                        );
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(entry),
                                },
                            ],
                            structuredContent: {
                                data: entry,
                            },
                        };
                    } catch (error) {
                        console.error('Error creating entry:', error);
                        let err = error as AxiosError;
                        if (err.response) {
                            throw Error(
                                `Error creating entry: ${err.response.status} ${err.response.statusText} - ${JSON.stringify(err.response.data)}`,
                            );
                        }
                        throw err;
                    }
                },
            );
        });
    }

    return (server) => {
        server.registerTool(
            'list_templates_and_entries',
            {
                description:
                    'List all templates and their entries. This tool should be called when you want to find out which templates and entries exist in the BCMS.',
                outputSchema: listTemplatesOutputSchema,
            },
            async () => {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(listOutput),
                        },
                    ],
                    structuredContent: {
                        templates: listOutput.templates,
                    },
                };
            },
        );
        entryTools.forEach((tool) => {
            tool(server);
        });
    };
}
