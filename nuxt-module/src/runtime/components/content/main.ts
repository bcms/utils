import { BCMSContentItem } from './item';
import { defineComponent, h } from 'vue';
import type { DefineSetupFnComponent, PropType, StyleValue } from 'vue';
import type { JSX } from 'vue/jsx-runtime';
import type { EntryContentParsedItem } from '@thebcms/types';
import type { Client, ClientConfig } from '@thebcms/client';

export interface BCMSWidgetComponents {
    [bcmsWidgetName: string]: DefineSetupFnComponent<
        {
            data: any;
        },
        any,
        any,
        any,
        any
    >;
}

export interface BCMSContentManagerProps {
    id?: string;
    className?: string;
    style?: StyleValue;
    items: EntryContentParsedItem[];
    widgetComponents?: BCMSWidgetComponents;
    nodeParser?(item: EntryContentParsedItem): string | JSX.Element;
    client?: Client | ClientConfig;
}

export const BCMSContentManager = defineComponent({
    props: {
        id: String,
        class: String,
        style: String,
        items: {
            type: Array as PropType<EntryContentParsedItem[]>,
            required: true,
        },
        widgetComponents: Object as PropType<BCMSWidgetComponents>,
        nodeParser: Function as PropType<
            (item: EntryContentParsedItem) => string | JSX.Element
        >,
    },
    setup(props) {
        return () => {
            return h(
                'div',
                {
                    id: props.id,
                    style: props.style,
                    class: `bcms-content ${props.class || ''}`,
                },
                props.items.map((item) => {
                    return h(BCMSContentItem, {
                        item,
                        components: props.widgetComponents,
                        nodeParser: props.nodeParser,
                    });
                }),
            );
        };
    },
});
