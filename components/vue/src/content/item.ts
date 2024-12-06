import {
    defineComponent,
    type DefineSetupFnComponent,
    h,
    type PropType,
} from 'vue';
import type { BCMSWidgetComponents } from '@thebcms/components-vue/content/main';
import type { JSX } from 'vue/jsx-runtime';
import type {
    EntryContentParsedItem,
    PropMediaDataParsed,
} from '@thebcms/types';
import type { Client, ClientConfig } from '@thebcms/client';
import { BCMSImage } from '@thebcms/components-vue/image';

export interface BCMSContentItemProps {
    item: EntryContentParsedItem;
    components?: BCMSWidgetComponents;
    nodeParser?(item: EntryContentParsedItem): string | React.JSX.Element;
    client: Client | ClientConfig;
}

export const BCMSContentItem = defineComponent({
    props: {
        item: {
            type: Object as PropType<EntryContentParsedItem>,
            required: true,
        },
        components: Object as PropType<BCMSWidgetComponents>,
        nodeParser: Function as PropType<
            (
                item: EntryContentParsedItem,
            ) => string | JSX.Element | DefineSetupFnComponent<any>
        >,
        client: Object as PropType<Client | ClientConfig>,
    },
    setup(props) {
        return () => {
            if (props.item.type === 'widget' && props.item.widgetName) {
                const name = props.item.widgetName;
                if (props.components && props.components[name]) {
                    const Widget = props.components[name];
                    return h(Widget, { data: props.item.value });
                } else {
                    return h(
                        'div',
                        {
                            style: { display: 'none' },
                            'data-bcms-widget-error': `Widget ${props.item.widgetName} is not handled`,
                        },
                        `Widget ${props.item.widgetName} is not handled`,
                    );
                }
            } else if (props.item.type === 'media') {
                if (!props.client) {
                    return h(
                        'div',
                        { style: { display: 'none' } },
                        `
                    Cannot mount media because BCMS Client Config was not
                    provided to the component
                    `,
                    );
                }
                return h(BCMSImage, {
                    media: props.item.value as PropMediaDataParsed,
                    client: props.client,
                });
            }
            if (!props.item.widgetName) {
                let value: unknown;
                if (props.nodeParser) {
                    value = props.nodeParser(props.item);
                } else {
                    value = props.item.value as string;
                }
                if (typeof value === 'string') {
                    return h('div', {
                        class: `bcms-content--primitive bcms-content--${props.item.type}`,
                        innerHTML: value,
                    });
                } else {
                    return h(value as any);
                }
            }
        };
    },
});
