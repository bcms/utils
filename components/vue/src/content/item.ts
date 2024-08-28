import {
    defineComponent,
    type DefineSetupFnComponent,
    h,
    type PropType,
} from 'vue';
import type { EntryContentParsedItem } from '@thebcms/client/types';
import type { BCMSWidgetComponents } from '@thebcms/components-vue/content/main';
import type { JSX } from 'vue/jsx-runtime';

export interface BCMSContentItemProps {
    item: EntryContentParsedItem;
    components?: BCMSWidgetComponents;
    nodeParser?(item: EntryContentParsedItem): string | React.JSX.Element;
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
    },
    setup(props) {
        return () => {
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
        };
    },
});
