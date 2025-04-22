<script>
    import BCMSContentManagerItem
        from '@thebcms/components-svelte/content/item.svelte';

    /**
     * @typedef {{
     *     [widgetName: string]: SvelteComponent<{data: any}>
     * }} BCMSWidgetComponents
     *
     * @type {{
     *     id?: string,
     *     class?: string,
     *     style?: string,
     *     items: import('@thebcms/types').EntryContentParsedItem[],
     *     widgetComponents?: BCMSWidgetComponents,
     *     nodeParser?: (item: import('@thebcms/types').EntryContentParsedItem) => any
     */
    let props = $props();
</script>

<div id={props.id} class="bcms-content {props.class || ''}" style={props.style}>
    {#each props.items as item}
        <BCMSContentManagerItem {item} components={props.widgetComponents}
                                nodeParser={props.nodeParser} />
    {/each}
</div>
