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
    let {
        id,
        class: className,
        style,
        media,
        clientConfig,
        altText,
    } = $props();

    const allowedMediaTypes = ['IMG', 'SVG' , 'GIF'];
    const client = new Client(
        {
            apiKey: `${clientConfig.apiKey}`,
            cmsOrigin: clientConfig.cmsOrigin,
            useMemCache: clientConfig.useMemCache,
            injectSvg: clientConfig.injectSvg,
            debug: clientConfig.debug,
            enableSocket: clientConfig.enableSocket,
        },
    );

    /**
     * @type {HTMLElement | null}
     */
    let imageElement = $state(null);
    let imageHandler = $derived(new ImageHandler(client, media));
    /**
     * @type {import('@thebcms/client').MediaExtended}
     */
    let mediaExtended = $derived(media);
    let imageAlt = $derived.by(() => {
        /**
         * @type {any}
         */
        const m = media;
        return altText || m.alt_text || m.altText || m.name;
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
    <div {id} {style} class={className}>
        <!--eslint-disable-next-line svelte/no-at-html-tags-->
        {@html mediaExtended.svg}
    </div>
{:else if !allowedMediaTypes.includes(media.type)}
    <div
        data-bcms-image-error="Media of type {media.type} cannot be used as image"
        style="display: none;"
    ></div>
{:else if !imageHandler.parsable}
    <img
        {id}
        {style}
        class={className}
        src={srcSet.original}
        alt={imageAlt()}
        width={media.width}
        height={media.height}
    />
{:else}
    <picture>
        <source srcset={srcSet.src1} type={'image/webp'} />
        <source srcset={srcSet.src2} type={media.mimetype} />
        <img
            bind:this={imageElement}
            {id}
            style={style ? style : className ? '' : 'width: 100%;'}
            class={className}
            src={srcSet.original}
            alt={imageAlt}
            width={srcSet.width}
            height={srcSet.height}
        />
    </picture>
{/if}
