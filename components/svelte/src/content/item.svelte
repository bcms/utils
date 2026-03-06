<script>
    import { BCMSImage } from '@thebcms/components-svelte';

    /**
     * @type {{
     *     item: import('@thebcms/types').EntryContentParsedItem,
     *     components?: {
     *     		[widgetName: string]: import('svelte').Component<{data: any}>
     *     },
     *     nodeParser?: (item: import('@thebcms/types').EntryContentParsedItem) => any;
     *     clientConfig?: import('@thebcms/client').ClientConfig;
     * }}
     */
    let {
            item,
            components,
            nodeParser,
            clientConfig,
    } = $props();

    const WidgetComponent = $derived(
        item.widgetName &&
        item.type === 'widget' &&
        components &&
        components[item.widgetName]
            ? components[item.widgetName]
            : undefined,
    );

    const PrimitiveNodeValue = $derived(
        nodeParser ? nodeParser(item) : item.value,
    );
    /**
     * @type {import('@thebcms/types').PropMediaDataParsed | undefined}
     */
    const imageNodeValue = $derived.by(() => {
        if (item.type !== 'media' || typeof item.value !== 'object') {
            return undefined;
        }
        /**
         * @type {import('@thebcms/types').PropMediaDataParsed}
         */
        const media = item.value;
        if (media.type !== 'IMG' && media.type !== 'GIF' && media.type !== 'SVG') {
            return undefined;
        }
        return media;
    });
</script>

{#if item.widgetName && item.type === 'widget'}
    {#if components && components[item.widgetName]}
        <WidgetComponent data={item.value} />
    {:else}
        <div
            style="display: none;"
            data-bcms-widget-error="Widget {item.widgetName} is not handled"
        >
            Widget {item.widgetName} is not handled
        </div>
    {/if}
{:else if imageNodeValue && clientConfig}
    <BCMSImage clientConfig={clientConfig} media={imageNodeValue} />
{:else if typeof PrimitiveNodeValue === 'function'}
    <PrimitiveNodeValue />
{:else if typeof PrimitiveNodeValue === 'object'}
    <div style="display: none;">
        <pre>{JSON.stringify(item || {}, null, 4)}</pre>
    </div>
{:else if typeof PrimitiveNodeValue === 'string'}
    <div class="bcms-content--primitive bcms-content--{item.type}">
        <!--eslint-disable-next-line svelte/no-at-html-tags-->
        {@html PrimitiveNodeValue}
    </div>
{/if}
