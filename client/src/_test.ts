import { Client } from '@thebcms/client';

async function parallelExecute(count: number, fn: () => Promise<void>) {
    const done = new Array(count).fill(false);
    await new Promise<void>((resolve) => {
        for (let i = 0; i < count; i++) {
            fn()
                .then(() => {
                    done[i] = true;
                    if (done.every((v) => v)) {
                        resolve();
                    }
                })
                .catch((err) => {
                    console.error(err);
                    done[i] = true;
                    if (done.every((v) => v)) {
                        resolve();
                    }
                });
        }
    });
}

async function main() {
    const client = new Client(
        '697b36079b2b656bb92f056b',
        {
            id: '699d8030ad4af489a204c58b',
            secret: '0198305f96b7df0142d1309c582359b2cfd36eb843cc4c287aba5f7ef65af2fd',
        },
        {
            cmsOrigin: 'http://localhost:8081',
        },
    );
    const cicles = 1;
    const parallel = 1;
    const timeOffset = Date.now();
    for (let i = 0; i < cicles; i++) {
        await parallelExecute(parallel, async () => {
            const res = await client.entry.getAll('blog');
            console.log(JSON.stringify(res, null, 4));
        });
    }
    const tte = Date.now() - timeOffset;
    console.log('TTE:', tte);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
