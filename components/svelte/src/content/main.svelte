<script>
    import BCMSContentManagerItem
        from '@thebcms/components-svelte/content/item.svelte';

    export let id = undefined;
    export { className as class };
    export let style = undefined;
    export let items;
    export let widgetComponents = {};
    export let nodeParser = undefined;

    let className = '';
</script>

<div {id} class="bcms-content {className}" {style}>
    {#each items as item}
        <BCMSContentManagerItem {item} components={widgetComponents}
                                {nodeParser} />
    {/each}
</div>
