'use client';

import React, { type JSX } from 'react';

import type { BCMSWidgetComponents } from '@thebcms/components-react/content/main';
import type {
    EntryContentParsedItem,
    PropMediaDataParsed,
} from '@thebcms/types';
import { BCMSImage } from '@thebcms/components-react/image';
import type { ClientConfig } from '@thebcms/client';

export interface BCMSContentItemProps {
    item: EntryContentParsedItem;
    components?: BCMSWidgetComponents;
    nodeParser?(item: EntryContentParsedItem): string | React.JSX.Element;
    clientConfig?: ClientConfig;
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
    } else if (props.item.type === 'media') {
        if (!props.clientConfig) {
            return (
                <div style={{ display: 'none' }}>
                    Cannot mount media because BCMS Client Config was not
                    provided to the component
                </div>
            );
        }
        return (
            <BCMSImage
                media={props.item.value as PropMediaDataParsed}
                clientConfig={props.clientConfig}
            />
        );
    }

    let value: string | JSX.Element = '';
    if (props.nodeParser) {
        value = props.nodeParser(props.item);
    } else {
        value = props.item.value as string;
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
