import type { EntryContentParsedItem } from '@thebcms/types';
import { type Component, SvelteComponent } from 'svelte';

declare const __propDef: {
    props: {
        item: EntryContentParsedItem;
        components?: {
            [widgetName: string]: Component<{ data: any }>;
        };
        nodeParser?: (item: EntryContentParsedItem) => any;
        clientConfig?: ClientConfig;
    };
};
type Props_ = typeof __propDef.props;
export { BCMSContentManagetItemProps as Props_ };
export default class BCMSContentManagerItem extends SvelteComponent<Props_> {}
