import { argsMap } from '@thebcms/cli/args';
import type { Cli } from '@thebcms/cli/main';
import type { InstanceStarters } from '@thebcms/types';
import { FS } from '@thebcms/utils/fs';
import inquirer from 'inquirer';

export async function lexington(cli: Cli): Promise<void> {
    let themeName = '';
    if (typeof cli.args.lexington === 'string') {
        themeName = cli.args.lexington;
    } else {
        let answer = { name: '' };
        while (!answer.name) {
            answer = await inquirer.prompt<{ name: string }>([
                {
                    message: 'Select a theme name',
                    name: 'name',
                    type: 'list',
                    choices: (argsMap.lexington.values as string[]).map(
                        (tn) => {
                            return {
                                name: tn,
                                value: tn,
                            };
                        },
                    ),
                },
            ]);
        }
        themeName = answer.name;
    }
    await cli.loginIfRequired();
    console.log(`\nCreating BCMS project...\n`);
    const instance = await cli.sdk.instance.create({
        name: themeName
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map((e) => e.slice(0, 1).toUpperCase() + e.slice(1).toLowerCase())
            .join(' '),
        starter: `lexington-${themeName}` as unknown as InstanceStarters,
        framework: `astro`,
    });
    console.log('\nSetting up API keys for the project...\n');
    const templates = await cli.sdk.template.getAll({
        instanceId: instance._id,
    });
    let apiKeyPrivate = await cli.sdk.apiKey.create({
        instanceId: instance._id,
        data: {
            name: `${themeName} Auto-generated Key - Private`,
            desc: 'Auto-generated key from BCMS CLI',
        },
    });
    const apiKeyPublic = await cli.sdk.apiKey.create({
        instanceId: instance._id,
        data: {
            name: `${themeName} Auto-generated Key - Public`,
            desc: 'Auto-generated key from BCMS CLI',
        },
    });
    apiKeyPrivate = await cli.sdk.apiKey.update({
        instanceId: instance._id,
        data: {
            _id: apiKeyPrivate._id,
            access: {
                mutateMedia: true,
                templates: templates.map((template) => {
                    return {
                        name: template.name,
                        _id: template._id,
                        get: true,
                        post: false,
                        put: false,
                        delete: false,
                    };
                }),
                functions: [],
            },
        },
    });

    const privateKeyValue = `${apiKeyPrivate._id}.${apiKeyPrivate.secret}.${instance._id}`;
    const publicKeyValue = `${apiKeyPublic._id}.${apiKeyPublic.secret}.${instance._id}`;

    const envs: string[] = [
        `BCMS_API_KEY=${privateKeyValue}`,
        `PUBLIC_BCMS_API_KEY=${publicKeyValue}`,
    ];
    const fs = new FS(process.cwd());
    if (await fs.exist('.env')) {
        const dotEnv = await fs.readString('.env');
        await fs.save(
            '.env',
            dotEnv + '\n\n# ---- BCMS ----\n' + envs.join('\n'),
        );
    } else {
        await fs.save('.env', envs.join('\n'));
    }
    console.log(
        `\n\nYour BCMS project is ready at https://app.thebcms.com/d/i/${instance._id}/bcms`,
    );
    console.log(`\nHappy coding!\n`);
    console.log(`npm install`);
    console.log(`npm run dev`);
}
