import type { EntryContentParsedItem } from '@thebcms/types';
import { type Component, SvelteComponent } from 'svelte';

export type BCMSWidgetComponents = Record<string, Component<{ data: any }>>;

declare const __propDef: {
    props: {
        id?: string;
        class?: string;
        style?: string;
        items: EntryContentParsedItem[];
        widgetComponents?: {
            [widgetName: string]: Component<{ data: any }>;
        };
        nodeParser?: (item: EntryContentParsedItem) => any;
        clientConfig?: ClientConfig;
    };
};
type Props_ = typeof __propDef.props;
export { BCMSContentManagetProps as Props_ };
export default class BCMSContentManager extends SvelteComponent<Props_> {}
