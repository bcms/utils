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
    let props = $props();

    const WidgetComponent = $derived(
        props.item.widgetName &&
        props.item.type === 'widget' &&
        props.components &&
        props.components[props.item.widgetName]
            ? props.components[props.item.widgetName]
            : undefined,
    );

    const PrimitiveNodeValue = $derived(
        props.nodeParser ? props.nodeParser(props.item) : props.item.value,
    );
    /**
     * @type {import('@thebcms/types').PropMediaDataParsed | undefined}
     */
    const imageNodeValue = $derived.by(() => {
        if (props.item.type !== 'media' || typeof props.item.value !== 'object') {
            return undefined;
        }
        /**
         * @type {import('@thebcms/types').PropMediaDataParsed}
         */
        const media = props.item.value;
        if (media.type !== 'IMG' && media.type !== 'GIF' && media.type !== 'SVG') {
            return undefined;
        }
        return media;
    });
</script>

{#if props.item.widgetName && props.item.type === 'widget'}
    {#if props.components && props.components[props.item.widgetName]}
        <WidgetComponent data={props.item.value} />
    {:else}
        <div
            style="display: none;"
            data-bcms-widget-error="Widget {props.item.widgetName} is not handled"
        >
            Widget {props.item.widgetName} is not handled
        </div>
    {/if}
{:else if imageNodeValue && props.clientConfig}
    <BCMSImage clientConfig={props.clientConfig} media={imageNodeValue} />
{:else if typeof PrimitiveNodeValue === 'function'}
    <PrimitiveNodeValue />
{:else if typeof PrimitiveNodeValue === 'object'}
    <div style="display: none;">
        <pre>{JSON.stringify(props.item || {}, null, 4)}</pre>
    </div>
{:else if typeof PrimitiveNodeValue === 'string'}
    <div class="bcms-content--primitive bcms-content--{props.item.type}">
        <!--eslint-disable-next-line svelte/no-at-html-tags-->
        {@html PrimitiveNodeValue}
    </div>
{/if}