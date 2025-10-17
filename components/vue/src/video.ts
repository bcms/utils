import { Client, type ClientConfig, type MediaExtended } from '@thebcms/client';
import type { Media, PropMediaDataParsed } from '@thebcms/types';
import { defineComponent, h, type PropType } from 'vue';

export interface BCMSVideoProps {
    id?: string;
    class?: string;
    style?: string;
    media: Media | MediaExtended | PropMediaDataParsed;
    client: Client | ClientConfig;
    altText?: string;
    useOriginal?: boolean;
    controls?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    playsinline?: boolean;
}

export const BCMSVideo = defineComponent({
    name: 'BCMSVideo',
    props: {
        id: String,
        class: String,
        style: String,
        media: {
            type: Object as PropType<
                Media | MediaExtended | PropMediaDataParsed
            >,
            required: true,
        },
        client: {
            type: Object as PropType<Client | ClientConfig>,
            required: true,
        },
        useOriginal: Boolean,
        altText: String,
        controls: Boolean,
        autoplay: Boolean,
        loop: Boolean,
        muted: Boolean,
        playsinline: Boolean,
    },
    setup(props) {
        const client =
            props.client instanceof Client
                ? props.client
                : new Client(
                      props.client.orgId,
                      props.client.instanceId,
                      props.client.apiKey,
                      {
                          enableSocket: props.client.enableSocket,
                          useMemCache: props.client.useMemCache,
                          cmsOrigin: props.client.cmsOrigin,
                          injectSvg: props.client.injectSvg,
                      },
                  );
        return () => {
            if (props.media.type !== 'VID') {
                return h('div', {
                    style: { display: 'none' },
                    'data-bcms-video-error': `Media of type ${props.media.type} cannot used as video`,
                });
            }
            const origin = client.cmsOrigin.includes('app.thebcms.com')
                ? 'https://cdn.thebcms.com'
                : client.cmsOrigin;
            return h(
                'video',
                {
                    id: props.id,
                    style: props.style,
                    class: props.class,
                    controls: props.controls,
                    autoplay: props.autoplay,
                    loop: props.loop,
                    muted: props.muted,
                    playsinline: props.playsinline,
                },
                h('source', {
                    src:
                        origin +
                        client.media.toUri(props.media._id, props.media.name),
                    type: props.media.mimetype,
                }),
            );
        };
    },
});
