import type { EntryContentParsedItem } from '@thebcms/types';
import { SvelteComponent } from 'svelte';

declare const __propDef: {
    props: {
        item: EntryContentParsedItem;
        components?: Record<string, SvelteComponent<{ data: any }>>;
        nodeParser?: (item: EntryContentParsedItem) => any;
    };
};
type Props_ = typeof __propDef.props;
export { BCMSContentManagetItemProps as Props_ };
export default class BCMSContentManagerItem extends SvelteComponent<Props_> {}
