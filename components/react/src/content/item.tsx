'use client';

import React, { type JSX } from 'react';

import type { EntryContentParsedItem } from '@thebcms/client/types';
import type { BCMSWidgetComponents } from '@thebcms/components-react/content/main';

export interface BCMSContentItemProps {
    item: EntryContentParsedItem;
    components?: BCMSWidgetComponents;
    nodeParser?(item: EntryContentParsedItem): string | React.JSX.Element;
}

export const BCMSContentItem: React.FC<BCMSContentItemProps> = (props) => {
    if (props.item.widgetName && props.item.type === 'widget') {
        if (props.components && props.components[props.item.widgetName]) {
            const Widget = props.components[props.item.widgetName];
            return <Widget data={props.item.value} />;
        } else {
            return (
                <div
                    style={{ display: 'none' }}
                    data-bcms-widget-error={`Widget ${props.item.widgetName} is not handled`}
                >
                    Widget {props.item.widgetName} is not handled
                </div>
            );
        }
    }

    let value: string | JSX.Element = '';
    if (props.nodeParser) {
        value = props.nodeParser(props.item);
    }
    if (typeof value === 'object') {
        return <>{value}</>;
    } else {
        return (
            <div
                className={`bcms-content--primitive bcms-content--${props.item.type}`}
                dangerouslySetInnerHTML={{
                    __html: value,
                }}
            />
        );
    }
};
