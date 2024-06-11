import type { Cli } from '@thebcms/cli/main';

export class MediaHandler {
    constructor(private cli: Cli) {}

    async pull(instanceId: string, orgId: string, outputPath?: string) {
        const destPath = outputPath ? outputPath.split('/') : ['bcms', 'media'];
        process.stdout.write('Get media information ... ');
        const allMedia = await this.cli.sdk.media.getAll({
            instanceId,
            orgId,
        });
        process.stdout.write('Done\n');
        for (let i = 0; i < allMedia.length; i++) {
            const media = allMedia[i];
            const mediaPath = this.cli.sdk.media.resolvePath(media, allMedia);
            process.stdout.write(
                `[${i + 1}/${allMedia.length}] Pulling media to path: ${mediaPath} ... `,
            );
            if (media.type !== 'DIR') {
                const buf = await this.cli.sdk.media.bin({
                    media,
                    orgId,
                    instanceId,
                    data: {
                        thumbnail: false,
                    },
                });
                await this.cli.localFs.save(
                    [...destPath, ...mediaPath.split('/')],
                    buf,
                );
            }
            process.stdout.write('Done\n');
        }
    }
}
