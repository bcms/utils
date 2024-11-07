import type {
    Group,
    Prop,
    PropValue,
    PropValueData,
    PropValueGroupPointerData,
    PropValueMediaData,
    PropValueRichTextData,
} from '@thebcms/types';

export function parsedPropsToRawProps(
    meta: any,
    schema: Prop[],
    oldValues: PropValue[],
    groups: Group[],
    level: string,
): PropValue[] {
    const props: PropValue[] = [];
    if (typeof meta !== 'object' || meta instanceof Array) {
        return props;
    }
    for (let i = 0; i < schema.length; i++) {
        const propSchema = schema[i];
        if (typeof meta[propSchema.name] === 'undefined') {
            if (propSchema.required) {
                throw Error(
                    `[${level}] Missing value for required property "${propSchema.name}"`,
                );
            }
            const oldValue = oldValues.find((e) => e.id === propSchema.id);
            props.push({
                id: propSchema.id,
                data: oldValue
                    ? oldValue.data
                    : getPropValueEmptyStateForType(propSchema),
            });
            continue;
        }
        const metaValue = meta[propSchema.name];
        if (
            propSchema.type === 'BOOLEAN' ||
            propSchema.type === 'NUMBER' ||
            propSchema.type === 'STRING'
        ) {
            const jsType = propSchema.type.toLowerCase();
            if (propSchema.array) {
                if (!(metaValue instanceof Array)) {
                    throw Error(
                        `[${level}.${propSchema.name}] must be an array of ${jsType}`,
                    );
                }
                const invalidTypeIdx = metaValue.findIndex(
                    (e) => typeof e !== jsType,
                );
                if (invalidTypeIdx !== -1) {
                    throw Error(
                        `[${level}.${propSchema.name}] item at index "${invalidTypeIdx}" is not ${jsType}`,
                    );
                }
                props.push({
                    id: propSchema.id,
                    data: metaValue,
                });
                continue;
            }
            if (typeof metaValue !== jsType) {
                throw Error(
                    `[${level}.${propSchema.name}] must be a ${jsType}`,
                );
            }
            props.push({
                id: propSchema.id,
                data: [metaValue],
            });
        } else if (propSchema.type === 'ENUMERATION') {
            if (!propSchema.data.propEnum) {
                throw Error(
                    `[${level}.${propSchema.name}] failed to find enumeration information for this property: INTERNAL_ERROR`,
                );
            }
            const jsType = 'string';
            if (propSchema.array) {
                if (!(metaValue instanceof Array)) {
                    throw Error(
                        `[${level}.${propSchema.name}] must be an array of ${jsType}`,
                    );
                }
                for (let j = 0; j < metaValue.length; j++) {
                    const valueItem = metaValue[j];
                    if (typeof valueItem !== 'string') {
                        throw Error(
                            `[${level}.${propSchema.name}] item at index "${j}" is not ${jsType}`,
                        );
                    } else if (
                        !propSchema.data.propEnum.items.find(
                            (e) => e === valueItem,
                        )
                    ) {
                        throw Error(
                            `[${level}.${propSchema.name}.${j}] item value "${valueItem}" is not allowed. Allowed values: ${propSchema.data.propEnum.items.join(', ')}`,
                        );
                    }
                }
                props.push({
                    id: propSchema.id,
                    data: metaValue,
                });
                continue;
            }
            if (typeof metaValue !== jsType) {
                throw Error(
                    `[${level}.${propSchema.name}] must be a ${jsType}`,
                );
            }
            props.push({
                id: propSchema.id,
                data: [metaValue],
            });
        } else if (propSchema.type === 'DATE') {
            if (propSchema.array) {
                if (!(metaValue instanceof Array)) {
                    throw Error(
                        `[${level}.${propSchema.name}] must be an array of objects`,
                    );
                }
                for (let j = 0; j < metaValue.length; j++) {
                    const valueItem = metaValue[j];
                    if (typeof valueItem !== 'object') {
                        throw Error(
                            `[${level}.${propSchema.name}] item at index "${j}" is not object`,
                        );
                    } else if (
                        typeof valueItem.timestamp !== 'number' ||
                        typeof valueItem.timezoneOffet !== 'number'
                    ) {
                        throw Error(
                            `[${level}.${propSchema.name}.${j}] item value "${JSON.stringify(valueItem)}" is not allowed. It must be formated: {timestamp: number, timezoneOffset: number}`,
                        );
                    }
                }
                props.push({
                    id: propSchema.id,
                    data: metaValue,
                });
                continue;
            }
            if (typeof metaValue !== 'object') {
                throw Error(`[${level}.${propSchema.name}] must be an object`);
            }
            if (
                typeof metaValue.timestamp !== 'number' ||
                typeof metaValue.timezoneOffet !== 'number'
            ) {
                throw Error(
                    `[${level}.${propSchema.name}] value "${JSON.stringify(metaValue)}" is not allowed. It must be formated: {timestamp: number, timezoneOffset: number}`,
                );
            }
            props.push({
                id: propSchema.id,
                data: [metaValue],
            });
        } else if (propSchema.type === 'ENTRY_POINTER') {
            if (propSchema.array) {
                if (!(metaValue instanceof Array)) {
                    throw Error(
                        `[${level}.${propSchema.name}] must be an array of objects`,
                    );
                }
                for (let j = 0; j < metaValue.length; j++) {
                    const valueItem = metaValue[j];
                    if (typeof valueItem !== 'object') {
                        throw Error(
                            `[${level}.${propSchema.name}] item at index "${j}" is not object`,
                        );
                    } else if (
                        typeof valueItem.entryId !== 'string' ||
                        typeof valueItem.templateId !== 'string'
                    ) {
                        throw Error(
                            `[${level}.${propSchema.name}.${j}] item value "${JSON.stringify(valueItem)}" is not allowed. It must be formated: {entryId: string, templateId: string}`,
                        );
                    }
                }
                props.push({
                    id: propSchema.id,
                    data: metaValue.map((e) => {
                        return {
                            eid: e.entryId,
                            tid: e.templateId,
                        };
                    }),
                });
                continue;
            }
            if (typeof metaValue !== 'object') {
                throw Error(`[${level}.${propSchema.name}] must be an abject`);
            }
            if (
                typeof metaValue.entryId !== 'string' ||
                typeof metaValue.templateId !== 'string'
            ) {
                throw Error(
                    `[${level}.${propSchema.name}] item value "${JSON.stringify(metaValue)}" is not allowed. It must be formated: {entryId: string, templateId: string}`,
                );
            }
            props.push({
                id: propSchema.id,
                data: [
                    {
                        eid: metaValue.entryId,
                        tid: metaValue.templateId,
                    },
                ],
            });
        } else if (propSchema.type === 'GROUP_POINTER') {
            if (!propSchema.data.propGroupPointer) {
                throw Error(
                    `[${level}.${propSchema.name}] failed to find group pointer information for this property: INTERNAL_ERROR`,
                );
            }
            const groupId = propSchema.data.propGroupPointer._id;
            const group = groups.find((e) => e._id === groupId);
            if (!group) {
                throw Error(
                    `[${level}.${propSchema.name}] group with ID "${groupId}" does not exist`,
                );
            }
            const oldGroupValue = oldValues.find((e) => e.id === propSchema.id);
            const oldGroupItems = oldGroupValue
                ? (oldGroupValue.data as PropValueGroupPointerData).items
                : [];
            if (propSchema.array) {
                if (!(metaValue instanceof Array)) {
                    throw Error(
                        `[${level}.${propSchema.name}] must be an array of objects`,
                    );
                }
                const groupItems: Array<{
                    props: PropValue[];
                }> = [];
                for (let j = 0; j < metaValue.length; j++) {
                    const valueItem = metaValue[j];
                    if (typeof valueItem !== 'object') {
                        throw Error(
                            `[${level}.${propSchema.name}] item at index "${j}" is not object`,
                        );
                    }
                    groupItems.push({
                        props: parsedPropsToRawProps(
                            valueItem,
                            group.props,
                            oldGroupItems[j] ? oldGroupItems[j].props : [],
                            groups,
                            `${level}.${j}.${propSchema.name}`,
                        ),
                    });
                }
                props.push({
                    id: propSchema.id,
                    data: {
                        _id: propSchema.data.propGroupPointer._id,
                        items: groupItems,
                    },
                });
                continue;
            }
            if (typeof metaValue !== 'object') {
                throw Error(`[${level}.${propSchema.name}] must be an abject`);
            }
            props.push({
                id: propSchema.id,
                data: {
                    _id: group._id,
                    items: [
                        {
                            props: parsedPropsToRawProps(
                                metaValue,
                                group.props,
                                oldGroupItems[0] ? oldGroupItems[0].props : [],
                                groups,
                                `${level}.${propSchema.name}`,
                            ),
                        },
                    ],
                },
            });
        } else if (propSchema.type === 'MEDIA') {
            if (propSchema.array) {
                if (!(metaValue instanceof Array)) {
                    throw Error(
                        `[${level}.${propSchema.name}] must be an array of object`,
                    );
                }
                const data: PropValueMediaData[] = [];
                for (let j = 0; j < metaValue.length; j++) {
                    const valueItem = metaValue[j];
                    if (typeof valueItem !== 'object') {
                        throw Error(
                            `[${level}.${propSchema.name}] item at index "${j}" is not object`,
                        );
                    }
                    if (typeof valueItem.mediaId !== 'string') {
                        throw Error(
                            `[${level}.${j}.${propSchema.name}] object is missing required property "mediaId"`,
                        );
                    }
                    data.push({
                        _id: valueItem.mediaId,
                        alt_text: valueItem.altText,
                        caption: valueItem.caption,
                    });
                }
                props.push({
                    id: propSchema.id,
                    data,
                });
                continue;
            }
            if (typeof metaValue !== 'object') {
                throw Error(`[${level}.${propSchema.name}] must be an object`);
            }
            if (typeof metaValue.mediaId !== 'string') {
                throw Error(
                    `[${level}.${propSchema.name}] object is missing required property "mediaId"`,
                );
            }
            props.push({
                id: propSchema.id,
                data: [
                    {
                        _id: metaValue.mediaId,
                        alt_text: metaValue.altText,
                        caption: metaValue.caption,
                    },
                ],
            });
        } else if (propSchema.type === 'RICH_TEXT') {
            if (propSchema.array) {
                if (!(metaValue instanceof Array)) {
                    throw Error(
                        `[${level}.${propSchema.name}] must be an array of object`,
                    );
                }
                const data: PropValueRichTextData[] = [];
                for (let j = 0; j < metaValue.length; j++) {
                    const valueItem = metaValue[j];
                    if (typeof valueItem !== 'object') {
                        throw Error(
                            `[${level}.${propSchema.name}] item at index "${j}" is not object`,
                        );
                    }
                    if (
                        typeof valueItem.nodes !== 'object' ||
                        !(valueItem.nodes instanceof Array)
                    ) {
                        throw Error(
                            `[${level}.${j}.${propSchema.name}] object is missing required property "nodes" of type object array`,
                        );
                    }
                    data.push(valueItem);
                }
                props.push({
                    id: propSchema.id,
                    data,
                });
                continue;
            }
            if (typeof metaValue !== 'object') {
                throw Error(`[${level}.${propSchema.name}] must be an object`);
            }
            if (
                typeof metaValue.nodes !== 'object' ||
                !(metaValue.nodes instanceof Array)
            ) {
                throw Error(
                    `[${level}.${propSchema.name}] object is missing required property "nodes" of type object array`,
                );
            }
            props.push({
                id: propSchema.id,
                data: [metaValue],
            });
        }
    }
    return props;
}

function getPropValueEmptyStateForType(propSchema: Prop): PropValueData {
    switch (propSchema.type) {
        case 'BOOLEAN': {
            return [];
        }
        case 'ENUMERATION': {
            return [];
        }
        case 'DATE': {
            return [];
        }
        case 'ENTRY_POINTER': {
            return [];
        }
        case 'GROUP_POINTER': {
            if (!propSchema.data.propGroupPointer) {
                throw Error(
                    `Property of type Group Pointer is missing data object: ${JSON.stringify(propSchema, null, 4)}`,
                );
            }
            return {
                _id: propSchema.data.propGroupPointer._id,
                items: [],
            };
        }
        case 'MEDIA': {
            return [];
        }
        case 'NUMBER': {
            return [];
        }
        case 'RICH_TEXT': {
            return [];
        }
        case 'STRING': {
            return [];
        }
    }
    return [];
}
