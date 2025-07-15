export default defineEventHandler(async (_event) => {
    const client = useBcmsPrivate();
    const entries = await client.entry.getAll('blog');
    return entries[0];
});
