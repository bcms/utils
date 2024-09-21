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
        await this.cli.loginIfRequired();
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
                type: 'checkbox',
                name: 'language',
                choices: [
                    {
                        name: 'TypeScript',
                        value: 'ts',
                    },
                    {
                        name: 'Rust',
                        value: 'rust',
                    },
                    {
                        name: 'Go Lang',
                        value: 'golang',
                    },
                    {
                        name: 'GraphQL',
                        value: 'gql',
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
