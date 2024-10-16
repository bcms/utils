<script>
    import { Client, ImageHandler } from '@thebcms/client';
    import { beforeUpdate, onDestroy, onMount } from 'svelte';

    export let id = undefined;
    export { className as class };
    export let style = undefined;
    export let media;
    export let clientConfig;
    export let altText = undefined;

    let className = '';
    const allowedMediaTypes = ['IMG', 'SVG'];
    const client = new Client(clientConfig.orgId,
        clientConfig.instanceId,
        clientConfig.apiKey,
        {
            cmsOrigin: clientConfig.cmsOrigin,
            useMemCache: clientConfig.useMemCache,
            injectSvg: clientConfig.injectSvg,
            debug: clientConfig.debug,
            enableSocket: clientConfig.enableSocket,
        });

    let imageElement = null;
    let imageHandler = new ImageHandler(client, media);
    let mediaExtended = media;
    let imageAlt =
        altText || media.alt_text || media.altText || media.name;
    let srcSet = imageHandler.getPictureSrcSet(0);

    $: {
        imageHandler = new ImageHandler(client, media);
        mediaExtended = media;
        imageAlt =
            altText || media.alt_text || media.altText || media.name;
        srcSet = imageHandler.getPictureSrcSet(0);
    }

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

    beforeUpdate(() => {
        onResize();
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
    />
{:else if !imageHandler.parsable}
    <img
        {id}
        {style}
        class={className}
        src={srcSet.original}
        alt={imageAlt}
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
