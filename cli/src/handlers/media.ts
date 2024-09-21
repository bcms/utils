import type { Cli } from '@thebcms/cli/main';
import type { Media } from '@thebcms/types';

export class MediaHandler {
    constructor(private cli: Cli) {}

    async pull(instanceId: string, orgId: string, outputPath?: string) {
        const destPath = outputPath ? outputPath.split('/') : ['bcms', 'media'];
        await this.cli.loginIfRequired();
        process.stdout.write('Get media information ... ');
        const allMedia = this.cli.client
            ? await this.cli.client.media.getAll()
            : await this.cli.sdk.media.getAll({
                  instanceId,
                  orgId,
              });
        process.stdout.write('Done\n');
        for (let i = 0; i < allMedia.length; i++) {
            const media = allMedia[i];
            const mediaPath = this.cli.sdk.media.resolvePath(
                media as Media,
                allMedia as Media[],
            );
            process.stdout.write(
                `[${i + 1}/${allMedia.length}] Pulling media to path: ${mediaPath} ... `,
            );
            if (media.type !== 'DIR') {
                const buf = this.cli.client
                    ? await this.cli.client.media.getMediaBin(
                          media._id,
                          media.name,
                      )
                    : await this.cli.sdk.media.bin({
                          media: media as Media,
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
