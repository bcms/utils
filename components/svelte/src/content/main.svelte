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
    let props = $props();
</script>

<div id={props.id} class="bcms-content {props.class || ''}" style={props.style}>
    {#each props.items as item}
        <BCMSContentManagerItem
            {item}
            components={props.widgetComponents}
            nodeParser={props.nodeParser}
            clientConfig={props.clientConfig}
        />
    {/each}
</div>
