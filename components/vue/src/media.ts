import { Client, type ClientConfig, type MediaExtended } from '@thebcms/client';
import { BCMSAudio, type BCMSAudioProps } from '@thebcms/components-vue/audio';
import { BCMSImage, type BCMSImageProps } from '@thebcms/components-vue/image';
import { BCMSVideo, type BCMSVideoProps } from '@thebcms/components-vue/video';
import type { Media, PropMediaDataParsed } from '@thebcms/types';
import { defineComponent, h, type PropType } from 'vue';

export type BCMSMediaProps = BCMSVideoProps & BCMSImageProps;

export const BCMSMedia = defineComponent({
    name: 'BCMSMedia',
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
        videoProps: {
            type: Object as PropType<Omit<BCMSVideoProps, 'media' | 'client'>>,
            default: () => ({}),
        },
        audioProps: {
            type: Object as PropType<Omit<BCMSAudioProps, 'media' | 'client'>>,
            default: () => ({}),
        },
        sizeTransform: Array as PropType<string[]>,
        useOriginal: Boolean,
        altText: String,
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
            if (
                props.media.type === 'IMG' ||
                props.media.type === 'SVG' ||
                props.media.type === 'GIF'
            ) {
                return h(BCMSImage, props);
            } else if (props.media.type === 'VID') {
                return h(BCMSVideo, {
                    controls: true,
                    playsinline: true,
                    ...props.videoProps,
                    client: props.client,
                    media: props.media,
                });
            } else if (props.media.type === 'AUDIO') {
                return h(BCMSAudio, {
                    controls: true,
                    playsinline: true,
                    ...props.audioProps,
                    client: props.client,
                    media: props.media,
                });
            } else {
                const origin = client.cmsOrigin.includes('app.thebcms.com')
                    ? 'https://cdn.thebcms.com'
                    : client.cmsOrigin;
                return h('iframe', {
                    style: props.style,
                    id: props.id,
                    class: `bcms-iframe ${props.class || ''}`,
                    src:
                        origin +
                        client.media.toUri(props.media._id, props.media.name),
                });
            }
        };
    },
});
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
