import type {
    Prop,
    Template,
    Group,
    Widget,
    Language,
    EntryStatus,
} from '@thebcms/types';
import z from 'zod';

const contentNodeTypes = z.enum([
    'paragraph',
    'heading',
    'widget',
    'bulletList',
    'listItem',
    'orderedList',
    'text',
    'codeBlock',
    'hardBreak',
    'horizontalRule',
    'media',
]);

const contentMarkTypes = z.enum([
    'bold',
    'italic',
    'underline',
    'strike',
    'link',
    'inlineCode',
]);

export function createEntryInputSchema(
    template: Template,
    groups: Group[],
    widgets: Widget[],
    languages: Language[],
    statuses: EntryStatus[],
) {
    return z.object({
        statuses: z.array(
            z.object({
                lng: z.enum(languages.map((e) => e.code)).meta({
                    description:
                        'The language code for which to set the status. This should be one of the languages defined in the BCMS.',
                }),
                id: z.enum(statuses.map((e) => e._id)).meta({
                    description:
                        'The ID of the status to set for the entry. This should be one of the statuses defined in the BCMS.',
                }),
            }),
        ),
        meta: z.array(
            z.object({
                lng: z.enum(languages.map((e) => e.code)).meta({
                    description:
                        'The language code for which to set the meta data.',
                }),
                data: parsePropsToRawInput(
                    template.props,
                    groups,
                    widgets,
                ).meta({
                    description: `The meta data to set for the entry. This should contain all the necessary data for the entry to be created properly. The shape of this object depends on the props defined for the template "${template.name}" in the BCMS.`,
                }),
            }),
        ),
        content: z.array(
            z.object({
                lng: z.enum(languages.map((e) => e.code)).meta({
                    description:
                        'The language code for which to set the content. This should be one of the languages defined in the BCMS.',
                }),
                nodes: z
                    .array(parseContentNodeToRawInput(groups, widgets, true))
                    .meta({
                        description:
                            'The content nodes to set for the entry. This should be an array of content nodes that represent the content of the entry. The structure of each content node is defined by the content node schema and can represent various types of content such as paragraphs, headings, widgets, etc.',
                    }),
            }),
        ),
    });
}

export function parseContentNodeToRawInput(
    groups: Group[],
    widgets: Widget[],
    allowWidgets: boolean,
) {
    const attrShape: Record<string, z.ZodType> = {
        level: z.number().optional().meta({
            description:
                'Available for heading nodes, indicates the heading level.',
        }),
        language: z.string().optional().meta({
            description:
                'Available for code block nodes, indicates the programming language of the code.',
        }),
        code: z.string().optional().meta({
            description:
                'Available for code block nodes, indicates the code content.',
        }),
        mediaId: z.string().optional().meta({
            description:
                'Available for media nodes, indicates the ID of the media item.',
        }),
        altText: z.string().optional().meta({
            description:
                'Available for media nodes, indicates the alt text of the media item.',
        }),
        caption: z.string().optional().meta({
            description:
                'Available for media nodes, indicates the caption of the media item.',
        }),
        propPath: z.string().optional().meta({
            description:
                'Available for widget nodes, indicates the path to the prop that the widget is rendering.',
        }),
    };
    if (allowWidgets) {
        attrShape.data = z
            .object({
                _id: z.enum(widgets.map((w) => w._id)).meta({
                    description:
                        'The ID of the widget. This is used to identify which widget to render.',
                }),
                props: z.union(
                    widgets.map((widget) => {
                        return parsePropsToRawInput(
                            widget.props,
                            groups,
                            widgets,
                        ).meta({
                            description: `The props of the widget with ID ${widget._id}. This should contain all the necessary data for the widget to render properly. The shape of this object depends on the props defined for the widget in the BCMS.`,
                        });
                    }),
                ),
            })
            .optional()
            .meta({
                description:
                    'Available for widget nodes, indicates the data of the widget. This is used to render the widget in the editor and should contain all the necessary data for the widget to render properly.',
            });
    }
    const nodeSchema: z.ZodObject = z
        .object({
            type: contentNodeTypes,
            attrs: z.object(attrShape).optional(),
            marks: z
                .array(
                    z.object({
                        type: contentMarkTypes,
                        href: z.string().optional().meta({
                            description:
                                'Available for link nodes, indicates the URL of the link.',
                        }),
                        target: z.string().optional().meta({
                            description:
                                'Available for link nodes, indicates the target of the link.',
                        }),
                    }),
                )
                .optional(),
            text: z.string().optional().meta({
                description:
                    'The text content of the node. This is only available for text nodes and should contain the actual text to be rendered.',
            }),
            content: z
                .array(z.lazy(() => nodeSchema))
                .optional()
                .meta({
                    description:
                        'The child nodes of this node. This is available for non-text nodes and should contain an array of child nodes that are part of this node.',
                }),
        })
        .meta({
            description:
                'This schema defines structure of BCMS content node. It is modified ProseMirror node schema that is used in BCMS to represent rich text content. Each node has a type that indicates what kind of content it represents (e.g. paragraph, heading, widget, etc.) and may have attributes and marks that provide additional information about how the content should be rendered.',
        });
    return nodeSchema;
}

export function parsePropsToRawInput(
    props: Prop[],
    groups: Group[],
    widgets: Widget[],
): z.ZodObject {
    const shape: Record<string, z.ZodType> = {};
    for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        switch (prop.type) {
            case 'NUMBER':
                {
                    shape[prop.name] = z.number();
                }
                break;
            case 'STRING':
                {
                    shape[prop.name] = z.string();
                }
                break;
            case 'BOOLEAN':
                {
                    shape[prop.name] = z.boolean();
                }
                break;
            case 'DATE':
                {
                    shape[prop.name] = z.object({
                        timestamp: z.number().meta({
                            description:
                                'The timestamp of the date in milliseconds',
                        }),
                        timezoneOffset: z.number().meta({
                            description:
                                'The timezone offset of the date in minutes',
                        }),
                    });
                }
                break;
            case 'MEDIA':
                {
                    shape[prop.name] = z.object({
                        mediaId: z.string().meta({
                            description: 'The ID of the media to link to',
                        }),
                        altText: z
                            .string()
                            .meta({
                                description:
                                    'The alt text for the media. This is used for accessibility and SEO purposes.',
                            })
                            .optional(),
                        caption: z.string().optional(),
                    });
                }
                break;
            case 'ENTRY_POINTER':
                {
                    if (!prop.data.propEntryPointer) {
                        break;
                    }
                    const data = prop.data.propEntryPointer;
                    shape[prop.name] = z.object({
                        templateId: z.enum(data.map((e) => e.templateId)).meta({
                            description:
                                'The ID of the template to link to. The entry must be part of this template.',
                        }),
                        entryId: z.string().meta({
                            description:
                                'The ID of the entry to link to. The entry must be part of the template specified by templateId.',
                        }),
                    });
                }
                break;
            case 'GROUP_POINTER':
                {
                    if (!prop.data.propGroupPointer) {
                        break;
                    }
                    const data = prop.data.propGroupPointer;
                    const group = groups.find((g) => g._id === data._id);
                    if (!group) {
                        break;
                    }
                    shape[prop.name] = parsePropsToRawInput(
                        group.props,
                        groups,
                        widgets,
                    );
                }
                break;
            case 'ENUMERATION':
                {
                    if (!prop.data.propEnum) {
                        break;
                    }
                    const data = prop.data.propEnum;
                    shape[prop.name] = z.enum(data.items);
                }
                break;
            case 'RICH_TEXT':
                {
                    shape[prop.name] = z.object({
                        nodes: z
                            .array(
                                parseContentNodeToRawInput(
                                    groups,
                                    widgets,
                                    false,
                                ),
                            )
                            .meta({
                                description:
                                    'The content nodes of the rich text. This should be an array of content nodes that represent the rich text content. The structure of each content node is defined by the content node schema and can represent various types of content such as paragraphs, headings, widgets, etc.',
                            }),
                    });
                }
                break;
        }
        if (prop.array) {
            shape[prop.name] = z.array(shape[prop.name]);
        }
        if (!prop.required) {
            shape[prop.name] = shape[prop.name].optional();
        }
    }
    return z.object(shape);
}
