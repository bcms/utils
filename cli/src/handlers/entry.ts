import type { Cli } from '@thebcms/cli/main';

export class EntryHandler {
    constructor(private cli: Cli) {}

    async pull(instanceId: string, orgId: string, outputPath?: string) {
        const destPath = outputPath
            ? outputPath.split('/')
            : ['bcms', 'entries'];
        process.stdout.write('Getting templates information ... ');
        await this.cli.loginIfRequired();
        const templates = this.cli.client
            ? await this.cli.client.template.getAll()
            : await this.cli.sdk.template.getAll({
                  instanceId,
                  orgId,
              });
        process.stdout.write('Done\n');
        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            process.stdout.write(
                `[${i + 1}/${templates.length}] Pulling entries for ${template.name} ... `,
            );
            const entries = this.cli.client
                ? await this.cli.client.entry.getAll(template._id)
                : await this.cli.sdk.entry.getAllParsed({
                      instanceId,
                      orgId,
                      templateId: template._id,
                  });
            await this.cli.localFs.save(
                [...destPath, template.name + '.json'],
                JSON.stringify(entries, null, 4),
            );
            process.stdout.write('Done\n');
        }
    }
}
