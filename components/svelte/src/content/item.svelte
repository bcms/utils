<script>
    /**
     * @type {{
     *     item: import('@thebcms/types').EntryContentParsedItem,
     *     components?: Record<string, SvelteComponent<{ data: any }>>;
     *     nodeParser?: (item: import('@thebcms/types').EntryContentParsedItem) => any;
     * }}
     */
    let props = $props();

    const WidgetComponent = $derived(
        props.item.widgetName && props.item.type === 'widget' && props.components && props.components[props.item.widgetName]
            ? props.components[props.item.widgetName]
            : undefined);

    const PrimitiveNodeValue = $derived(props.nodeParser ? props.nodeParser(props.item) : (props.item.value));
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
{:else if typeof PrimitiveNodeValue === 'object'}
    <PrimitiveNodeValue />
{:else}
    <div class="bcms-content--primitive bcms-content--{props.item.type}">
        <!--eslint-disable-next-line svelte/no-at-html-tags-->
        {@html PrimitiveNodeValue}
    </div>
{/if}
