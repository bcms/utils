<script>
    export let item;
    export let components = undefined;
    export let nodeParser = undefined;

    $: WidgetComponent =
        item.widgetName && item.type === 'widget' && components && components[item.widgetName]
            ? components[item.widgetName]
            : undefined;

    $: PrimitiveNodeValue = nodeParser ? nodeParser(item) : (item.value);
</script>

{#if item.widgetName && item.type === 'widget'}
    {#if components && components[item.widgetName]}
        <svelte:component this={WidgetComponent} data={item.value} />
    {:else}
        <div
            style="display: none;"
            data-bcms-widget-error="Widget {item.widgetName} is not handled"
        >
            Widget {item.widgetName} is not handled
        </div>
    {/if}
{:else if typeof PrimitiveNodeValue === 'object'}
    <svelte:component this={PrimitiveNodeValue} />
{:else}
    <div class="bcms-content--primitive bcms-content--{item.type}">
        <!--eslint-disable-next-line svelte/no-at-html-tags-->
        {@html PrimitiveNodeValue}
    </div>
{/if}
