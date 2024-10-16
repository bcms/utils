import type { EntryContentParsedItem } from '@thebcms/types';
import { SvelteComponent } from 'svelte';

export type BCMSWidgetComponents = Record<
    string,
    SvelteComponent<{ data: any }>
>;

declare const __propDef: {
    props: {
        id?: string;
        style?: string;
        class?: string;
        items: EntryContentParsedItem[];
        widgetComponents?: BCMSWidgetComponents;
        nodeParser?: (item: EntryContentParsedItem) => any;
    };
};
type Props_ = typeof __propDef.props;
export { BCMSContentManagetProps as Props_ };
export default class BCMSContentManager extends SvelteComponent<Props_> {}
