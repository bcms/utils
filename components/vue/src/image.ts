import {
    computed,
    defineComponent,
    h,
    onBeforeUnmount,
    onBeforeUpdate,
    onMounted,
    type PropType,
    ref,
} from 'vue';
import type { Media, MediaTypeName, PropMediaDataParsed } from '@thebcms/types';
import {
    Client,
    type ClientConfig,
    ImageHandler,
    type MediaExtended,
} from '@thebcms/client';

export interface BCMSImageProps {
    id?: string;
    className?: string;
    style?: string;
    media: Media | MediaExtended | PropMediaDataParsed;
    client: Client | ClientConfig;
    altText?: string;
    useOriginal?: boolean;
}

const allowedMediaTypes: MediaTypeName[] = ['IMG', 'SVG'];

export const BCMSImage = defineComponent({
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
        sizeTransform: Array as PropType<string[]>,
        useOriginal: Boolean,
        altText: String,
    },
    setup(props) {
        const client =
            props.client instanceof Client
                ? props.client
                : new Client({
                      apiKey: `${props.client.apiKey.id}:${props.client.apiKey.secret}.${props.client.instanceId}`,
                      enableSocket: props.client.enableSocket,
                      useMemCache: props.client.useMemCache,
                      cmsOrigin: props.client.cmsOrigin,
                      injectSvg: props.client.injectSvg,
                  });
        let idBuffer = '';
        const imageElement = ref<HTMLImageElement>();
        const imageHandler = computed(() => {
            return new ImageHandler(client, props.media, props.sizeTransform);
        });
        const mediaExtended = computed(() => props.media as MediaExtended);
        const srcSet = ref(
            /**
             * By default, get the smallest image in the set.
             * When DOM is loaded, we will be able to get
             * size of the parent element that is holding the
             * image and calculate the best image size that
             * should be in it.
             *
             * This will ensure that first page load is not
             * impacted by large image and then when page is
             * loaded, higher resolution images will be loaded
             * if required.
             */
            imageHandler.value.getPictureSrcSet(0),
        );

        function resizeHandler() {
            if (imageElement.value && imageHandler.value.parsable) {
                srcSet.value = imageHandler.value.getPictureSrcSet(
                    imageElement.value.offsetWidth,
                );
            }
        }

        onMounted(() => {
            idBuffer = props.media._id;
            window.addEventListener('resize', resizeHandler);
            resizeHandler();
        });

        onBeforeUnmount(() => {
            window.removeEventListener('resize', resizeHandler);
        });

        onBeforeUpdate(() => {
            if (idBuffer === props.media._id) {
                return;
            }
            idBuffer = props.media._id;
            resizeHandler();
        });

        return () => {
            if (props.useOriginal) {
                const original =
                    client.getConfig().cmsOrigin +
                    client.media.toUri(props.media._id, props.media.name);
                const webp =
                    client.getConfig().cmsOrigin +
                    client.media.toUri(props.media._id, props.media.name, {
                        webp: true,
                    });
                return h('picture', {}, [
                    h('source', {
                        srcset: webp,
                        type: 'image/webp',
                    }),
                    h('img', {
                        ref: imageElement,
                        id: props.id,
                        style: props.style
                            ? props.style
                            : props.class
                              ? {}
                              : {
                                    width: '100%',
                                },
                        class: props.class,
                        src: original,
                        alt:
                            props.altText ||
                            (props.media as PropMediaDataParsed).alt_text ||
                            (props.media as Media).altText ||
                            props.media.name,
                        width: props.media.width,
                        height: props.media.height,
                    }),
                ]);
            } else if (props.client.injectSvg && mediaExtended.value.svg) {
                let svg = mediaExtended.value.svg;
                if (props.class) {
                    svg = svg.replace(/<svg /, `<svg class="${props.class}" `);
                }
                if (props.style) {
                    svg = svg.replace(/<svg /, `<svg style="${props.style}" `);
                }
                return h('div', {
                    id: props.id,
                    // style: props.style,
                    // class: props.class,
                    innerHTML: svg,
                });
            } else if (
                !allowedMediaTypes.includes(props.media.type as MediaTypeName)
            ) {
                return h('div', {
                    id: props.id,
                    style: 'display: none;' + (props.style || ''),
                    class: props.class,
                    'data-bcms-image-error': `Media of type ${props.media.type} cannot be used as image`,
                });
            } else if (!imageHandler.value.parsable) {
                return h('img', {
                    id: props.id,
                    style: props.style,
                    class: props.class,
                    src: srcSet.value.original,
                    alt:
                        props.altText ||
                        (props.media as PropMediaDataParsed).alt_text ||
                        (props.media as Media).altText ||
                        props.media.name,
                    width: props.media.width,
                    height: props.media.height,
                });
            } else {
                return h('picture', {}, [
                    h('source', {
                        srcset: srcSet.value.src1,
                        type: 'image/webp',
                    }),
                    h('source', {
                        srcset: srcSet.value.src2,
                        type: props.media.mimetype,
                    }),
                    h('img', {
                        ref: imageElement,
                        id: props.id,
                        style: props.style
                            ? props.style
                            : props.class
                              ? {}
                              : {
                                    width: '100%',
                                },
                        class: props.class,
                        src: srcSet.value.original,
                        alt:
                            props.altText ||
                            (props.media as PropMediaDataParsed).alt_text ||
                            (props.media as Media).altText ||
                            props.media.name,
                        width: srcSet.value.width,
                        height: srcSet.value.height,
                    }),
                ]);
            }
        };
    },
});
