import type { EntryContentParsedItem } from '@thebcms/client/types';
import { BCMSContentItem } from '@thebcms/components-vue/content/item';
import {
    defineComponent,
    type DefineSetupFnComponent,
    h,
    type PropType,
} from 'vue';
import type { JSX } from 'vue/jsx-runtime';

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
    style?: React.CSSProperties;
    items: EntryContentParsedItem[];
    widgetComponents?: BCMSWidgetComponents;
    nodeParser?(item: EntryContentParsedItem): string | React.JSX.Element;
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
