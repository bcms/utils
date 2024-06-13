'use client'

import React from 'react';

import type { EntryContentParsedItem } from '@thebcms/client/types';
import { BCMSContentItem } from '@thebcms/components-react/content/item';

export interface BCMSWidgetComponents {
    [bcmsWidgetName: string]: React.FC<{
        data: any;
    }>;
}

export interface BCMSContentManagerProps {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    items: EntryContentParsedItem[];
    widgetComponents?: BCMSWidgetComponents;
    nodeParser?(item: EntryContentParsedItem): string | React.JSX.Element;
}

export const BCMSContentManager: React.FC<BCMSContentManagerProps> = (
    props,
) => {
    return (
        <div
            id={props.id}
            className={`bcms-content ${props.className || ''}`}
            style={props.style}
        >
            {props.items.map((item, itemIdx) => {
                return (
                    <BCMSContentItem
                        key={itemIdx}
                        item={item}
                        components={props.widgetComponents}
                        nodeParser={props.nodeParser}
                    />
                );
            })}
        </div>
    );
};
