<script>
    import BCMSContentManagerItem
        from '@thebcms/components-svelte/content/item.svelte';

    /**
     * @type {{
     *     id?: string,
     *     class?: string,
     *     style?: string,
     *     items: import('@thebcms/types').EntryContentParsedItem[],
     *     widgetComponents?: {
     *     		[widgetName: string]: import('svelte').Component<{data: any}>
     *     },
     *     nodeParser?: (item: import('@thebcms/types').EntryContentParsedItem) => any
     *     clientConfig?: import('@thebcms/client').ClientConfig;
     * }}
     */
    let {
        id,
        class: className,
        style,
        items,
        widgetComponents,
        nodeParser,
        clientConfig,
    } = $props();
</script>

<div {id} class="bcms-content {className || ''}" {style}>
    {#each items as item}
        <BCMSContentManagerItem
            {item}
            components={widgetComponents}
            nodeParser={nodeParser}
            clientConfig={clientConfig}
        />
    {/each}
</div>
