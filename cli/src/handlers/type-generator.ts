import type { TypeGeneratorLanguage } from '@thebcms/types';
import type { Cli } from '@thebcms/cli/main';
import inquirer from 'inquirer';

const prettyLangTypeName = {
    ts: 'TypeScript',
    gql: 'GraphQL',
    rust: 'Rust',
    golang: 'Go Language',
};

export class TypeGeneratorHandler {
    constructor(private cli: Cli) {}

    async pull(
        instanceId: string,
        orgId: string,
        language: TypeGeneratorLanguage,
        outputPath?: string,
    ) {
        if (!this.cli.client) {
            await this.cli.loginIfRequired();
        }
        process.stdout.write(
            `Pulling types for ${prettyLangTypeName[language]} ... `,
        );
        const destPath = outputPath
            ? outputPath.split('/')
            : ['bcms', 'types', language];
        const filesInfo = this.cli.client
            ? await this.cli.client.typeGenerator.getFiles(language)
            : await this.cli.sdk.typeGenerator.getTypes({
                  instanceId,
                  orgId,
                  lang: language,
              });
        process.stdout.write('Done\n');
        process.stdout.write(`Saving types to ${destPath.join('/')}/* ... `);
        if (await this.cli.localFs.exist(destPath)) {
            await this.cli.localFs.deleteDir(destPath);
        }
        for (let i = 0; i < filesInfo.length; i++) {
            const fileInfo = filesInfo[i];
            await this.cli.localFs.save(
                [...destPath, ...fileInfo.path.split('/')],
                fileInfo.content,
            );
        }
        process.stdout.write('Done\n');
    }

    async selectLanguage() {
        const answers = await inquirer.prompt<{
            language: TypeGeneratorLanguage[];
        }>([
            {
                message: 'Select language for which to pull' + ' types: ',
                type: 'list',
                name: 'language',
                choices: [
                    {
                        name: 'TypeScript',
                        value: 'ts',
                    },
                    {
                        name: 'GraphQL',
                        value: 'gql',
                    },
                    {
                        name: 'Rust (Coming soon)',
                        value: 'rust',
                        disabled: true,
                    },
                    {
                        name: 'Go Lang (Coming soon)',
                        value: 'golang',
                        disabled: true,
                    },
                ],
            },
        ]);
        if (!answers.language) {
            throw Error('You must select a language');
        }
        return answers.language;
    }
}
