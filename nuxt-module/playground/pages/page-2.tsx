import { NuxtLink } from '#components';

export default defineNuxtComponent({
    async setup() {
        const config = useRuntimeConfig();
        const { data, error } = await useAsyncData('page-2', async (ctx) => {
            console.log(
                'async data',
                JSON.stringify(ctx?.$config.bcms || {}, null, 4),
            );
            return { test: 'yo2' };
        });
        if (error.value) {
            console.log('error', error.value);
        }

        onMounted(() => {
            console.log('public', config);
        });

        return () => (
            <div>
                <div>Page 2</div>
                <NuxtLink to="/">Page 1</NuxtLink>
                <div>Async res: {data.value?.test}</div>
            </div>
        );
    },
});
