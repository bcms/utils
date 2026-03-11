import type { Prop, Template, Group, Widget, Language } from '@thebcms/types';
import zod from 'zod';

let contentNodeSchema: zod.ZodObject<any> | null = null;
let widgetContentNodeSchema: zod.ZodObject<any> | null = null;

export function createZodEntrySchema(
    template: Template,
    templates: Template[],
    groups: Group[],
    widgets: Widget[],
    languages: Language[],
) {
    const metaProps = createZodSchemaFromPropSchema(
        template.props,
        templates,
        groups,
        widgets,
        languages,
    );
    const meta: any = {};
    if (!contentNodeSchema) {
        contentNodeSchema = _nodeContentToZod(
            false,
            templates,
            groups,
            widgets,
            languages,
        );
    }
    const contentNode = contentNodeSchema;
    const content: any = {};
    for (let i = 0; i < languages.length; i++) {
        const lang = languages[i];
        meta[lang.code] = metaProps;
        content[lang.code] = zod.array(contentNode);
    }
    return zod.object({
        _id: zod.string(),
        createdAt: zod.number(),
        updatedAt: zod.number(),
        instanceId: zod.string(),
        templateId: zod.string(),
        templateName: zod.string(),
        userId: zod.string(),
        statuses: zod.array(
            zod.object({
                id: zod.string(),
                lng: zod.string(),
                label: zod.string(),
            }),
        ),
        meta: zod.object(meta),
        content: zod.object(content),
    });
}

export function createZodSchemaFromPropSchema(
    props: Prop[],
    templates: Template[],
    groups: Group[],
    widgets: Widget[],
    languages: Language[],
) {
    const zodProps: any = {};
    for (let i = 0; i < props.length; i++) {
        const propSchema = props[i];
        switch (propSchema.type) {
            case 'NUMBER':
                {
                    zodProps[propSchema.name] = propSchema.array
                        ? zod.array(zod.number())
                        : zod.number();
                }
                break;
            case 'STRING':
                {
                    zodProps[propSchema.name] = propSchema.array
                        ? zod.array(zod.string())
                        : zod.string();
                }
                break;
            case 'BOOLEAN':
                {
                    zodProps[propSchema.name] = propSchema.array
                        ? zod.array(zod.boolean())
                        : zod.boolean();
                }
                break;
            case 'DATE':
                {
                    const val = zod.object({
                        timestamp: zod.number(),
                        timezoneOffset: zod.number(),
                    });
                    zodProps[propSchema.name] = propSchema.array
                        ? zod.array(val)
                        : val;
                }
                break;
            case 'MEDIA':
                {
                    const val = zod.object({
                        _id: zod.string(),
                        src: zod.string(),
                        name: zod.string(),
                        width: zod.number(),
                        height: zod.number(),
                        caption: zod.string(),
                        alt_text: zod.string(),
                        type: zod.string(),
                        mimetype: zod.string(),
                        size: zod.number(),
                        sizeTransforms: zod.array(zod.string()).optional(),
                        version: zod.string().optional(),
                        url: zod.string(),
                        svg: zod.string().optional(),
                    });
                    zodProps[propSchema.name] = propSchema.array
                        ? zod.array(val)
                        : val;
                }
                break;
            case 'ENUMERATION':
                {
                    zodProps[propSchema.name] = propSchema.array
                        ? zod.array(zod.string())
                        : zod.string();
                }
                break;
            case 'RICH_TEXT':
                {
                    if (!widgetContentNodeSchema) {
                        widgetContentNodeSchema = zod.object({
                            nodes: zod.array(
                                _nodeContentToZod(
                                    true,
                                    templates,
                                    groups,
                                    widgets,
                                    languages,
                                ),
                            ),
                        });
                    }
                    zodProps[propSchema.name] = propSchema.array
                        ? zod.array(widgetContentNodeSchema)
                        : widgetContentNodeSchema;
                }
                break;
            case 'GROUP_POINTER':
                {
                    if (!propSchema.data.propGroupPointer) {
                        break;
                    }
                    const data = propSchema.data.propGroupPointer;
                    const group = groups.find((g) => g._id === data._id);
                    if (!group) {
                        break;
                    }
                    const val = createZodSchemaFromPropSchema(
                        group.props,
                        templates,
                        groups,
                        widgets,
                        languages,
                    );
                    zodProps[propSchema.name] = propSchema.array
                        ? zod.array(zod.object(val))
                        : zod.object(val);
                }
                break;
            case 'ENTRY_POINTER':
                {
                    if (!propSchema.data.propEntryPointer) {
                        break;
                    }
                    const data = propSchema.data.propEntryPointer;
                    let val: zod.ZodUnion | zod.ZodObject = null as never;
                    for (let i = 0; i < data.length; i++) {
                        const entryData = data[i];
                        const template = templates.find(
                            (t) => t._id === entryData.templateId,
                        );
                        if (!template) {
                            continue;
                        }
                        const entryVal = createZodSchemaFromPropSchema(
                            template.props,
                            templates,
                            groups,
                            widgets,
                            languages,
                        );
                        if (val) {
                            val.or(entryVal);
                        } else {
                            val = entryVal;
                        }
                    }
                }
                break;
        }
        if (!propSchema.required) {
            zodProps[propSchema.name] = zodProps[propSchema.name].optional();
        }
    }
    return zod.object(zodProps);
}

function _nodeContentToZod(
    isRechText: boolean,
    templates: Template[],
    groups: Group[],
    widgets: Widget[],
    languages: Language[],
) {
    let widgetObjects: zod.ZodObject[] = [];
    if (!isRechText) {
        for (let i = 0; i < widgets.length; i++) {
            const widget = widgets[i];
            const val = createZodSchemaFromPropSchema(
                widget.props,
                templates,
                groups,
                widgets,
                languages,
            );
            widgetObjects.push((val as any).optional());
        }
    }
    const attrs = zod
        .object({
            level: zod.number().optional().meta({
                description:
                    'Available for heading nodes, indicates the heading level.',
            }),
            href: zod.string().optional().meta({
                description:
                    'Available for link nodes, indicates the URL of the link.',
            }),
            target: zod.string().optional().meta({
                description:
                    'Available for link nodes, indicates the target of the link.',
            }),
            language: zod.string().optional().meta({
                description:
                    'Available for code block nodes, indicates the programming language of the code.',
            }),
            code: zod.string().optional().meta({
                description:
                    'Available for code block nodes, indicates the code content.',
            }),
            mediaId: zod.string().optional().meta({
                description:
                    'Available for media nodes, indicates the ID of the media item.',
            }),
            altText: zod.string().optional().meta({
                description:
                    'Available for media nodes, indicates the alt text of the media item.',
            }),
            caption: zod.string().optional().meta({
                description:
                    'Available for media nodes, indicates the caption of the media item.',
            }),
            propPath: zod.string().optional().meta({
                description:
                    'Available for widget nodes, indicates the path to the prop that the widget is rendering.',
            }),
        })
        .optional();
    return zod.object({
        type: zod.string(),
        widgetName: zod.string().optional(),
        attrs,
        value: isRechText
            ? zod.string()
            : zod.union([zod.string(), ...widgetObjects]),
    });
}
