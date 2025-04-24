<script>
    import { Client, ImageHandler } from '@thebcms/client';
    import { onDestroy, onMount } from 'svelte';

    /**
     * @type {{
     *     id?: string,
     *     class?: string,
     *     style?: string,
     *     media: import('@thebcms/types').Media | import('@thebcms/client').MediaExtended | import('@thebcms/types').PropMediaDataParsed,
     *     clientConfig: import('@thebcms/client').ClientConfig,
     *     altText?: string,
     * }}
     */
    let props = $props();

    const allowedMediaTypes = ['IMG', 'SVG' , 'GIF'];
    const client = new Client(
        props.clientConfig.orgId,
        props.clientConfig.instanceId,
        props.clientConfig.apiKey,
        {
            cmsOrigin: props.clientConfig.cmsOrigin,
            useMemCache: props.clientConfig.useMemCache,
            injectSvg: props.clientConfig.injectSvg,
            debug: props.clientConfig.debug,
            enableSocket: props.clientConfig.enableSocket,
        },
    );

    /**
     * @type {HTMLElement | null}
     */
    let imageElement = $state(null);
    let imageHandler = $derived(new ImageHandler(client, props.media));
    /**
     * @type {import('@thebcms/client').MediaExtended}
     */
    let mediaExtended = $derived(props.media);
    let imageAlt = $derived.by(() => {
        /**
         * @type {any}
         */
        const m = props.media;
        return props.altText || m.alt_text || m.altText || m.name;
    });
    let srcSet = $derived(imageHandler.getPictureSrcSet(0));

    /**
     * @type {NodeJS.Timeout | undefined}
     */
    let resizeDebounce = undefined;

    function onResize() {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(() => {
            if (imageElement) {
                const parent = imageElement.parentElement;
                if (parent) {
                    srcSet = imageHandler.getPictureSrcSet(parent.offsetWidth);
                }
            }
        });
    }

    onMount(() => {
        onResize();
        if (typeof window !== 'undefined' && imageHandler.parsable) {
            window.addEventListener('resize', onResize);
        }
    });

    onDestroy(() => {
        if (typeof window !== 'undefined' && imageHandler.parsable) {
            window.removeEventListener('resize', onResize);
        }
    });
</script>

{#if client.injectSvg && mediaExtended.svg}
    <div id={props.id} style={props.style} class={props.class}>
        <!--eslint-disable-next-line svelte/no-at-html-tags-->
        {@html mediaExtended.svg}
    </div>
{:else if !allowedMediaTypes.includes(props.media.type)}
    <div
        data-bcms-image-error="Media of type {props.media.type} cannot be used as image"
        style="display: none;"
    ></div>
{:else if !imageHandler.parsable}
    <img
        id={props.id}
        style={props.style}
        class={props.class}
        src={srcSet.original}
        alt={imageAlt()}
        width={props.media.width}
        height={props.media.height}
    />
{:else}
    <picture>
        <source srcset={srcSet.src1} type={'image/webp'} />
        <source srcset={srcSet.src2} type={props.media.mimetype} />
        <img
            bind:this={imageElement}
            id={props.id}
            style={props.style ? props.style : props.class ? '' : 'width: 100%;'}
            class={props.class}
            src={srcSet.original}
            alt={imageAlt}
            width={srcSet.width}
            height={srcSet.height}
        />
    </picture>
{/if}
