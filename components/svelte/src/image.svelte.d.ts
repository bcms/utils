import type { Media, PropMediaDataParsed } from '@thebcms/types';
import type { ClientConfig, MediaExtended } from '@thebcms/client';
import { SvelteComponent } from 'svelte';

declare const __propDef: {
    props: {
        id?: string;
        class?: string;
        style?: string;
        media: Media | MediaExtended | PropMediaDataParsed;
        clientConfig: ClientConfig;
        altText?: string;
    };
};
type BCMSImageProps_ = typeof __propDef.props;
export { BCMSImageProps_ as BCMSImageProps };
export default class BCMSImage extends SvelteComponent<BCMSImageProps_> {}
