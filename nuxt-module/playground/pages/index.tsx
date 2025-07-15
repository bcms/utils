import { NuxtLink } from '#components';
import type { BlogEntry } from '#bcms-type';
import { BCMSImage } from '../../src/runtime/components/image';

export default defineNuxtComponent({
    async setup() {
        const { data, error } = useFetch<BlogEntry>('/api/clients');
        if (error.value) {
            console.log('error', error.value);
        }

        onMounted(() => {});

        const meta = data.value?.meta.en;

        return () => (
            <div>
                <div>Page 1</div>
                <NuxtLink to="/page-2">Page 2</NuxtLink>
                <div>{meta?.title}</div>
                {meta && meta.image && <BCMSImage media={meta.image.src} />}
            </div>
        );
    },
});
