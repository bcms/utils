import type { Cli } from '@thebcms/cli';
import inquirer from 'inquirer';
import { getStartersInfo } from '@thebcms/cli/starters-info';
import { FS } from '@thebcms/utils/fs';
import { ChildProcess } from '@thebcms/utils/child-process';
import type { InstanceStarters } from '@thebcms/types';

export async function createHandler(cli: Cli): Promise<void> {
    let projectName = cli.args.projectName || '';
    let framework = typeof cli.args.create === 'string' ? cli.args.create : '';
    let starter: InstanceStarters =
        (cli.args.starter as InstanceStarters) || '';
    if (!projectName) {
        let answer = { name: '' };
        while (!answer.name) {
            answer = await inquirer.prompt<{ name: string }>([
                {
                    message: 'What will your project be called:',
                    name: 'name',
                    type: 'input',
                },
            ]);
        }
        projectName = answer.name;
    }
    const startersInfo = await getStartersInfo();
    if (
        framework &&
        !startersInfo.saas.frameworks.find((e) => e.id === framework)
    ) {
        console.log(
            `Framework "${framework}" is not supported. Please select a framework from the list bellow.`,
        );
        framework = '';
    }
    if (!framework) {
        let answer = { name: '' };
        while (!answer.name) {
            answer = await inquirer.prompt<{ name: string }>([
                {
                    message: 'Select a framework',
                    name: 'name',
                    type: 'list',
                    choices: startersInfo.saas.frameworks.map((frame) => {
                        return {
                            name: `${frame.title}${frame.available ? '' : ` (Coming soon)`}`,
                            value: frame.id,
                            disabled: !frame.available,
                        };
                    }),
                },
            ]);
        }
        framework = answer.name;
    }
    if (
        starter &&
        !startersInfo.saas.starters.find((e) => e.slug === starter)
    ) {
        console.log(
            `Starter "${starter}" is not available. Please select a framework from the list bellow.`,
        );
        starter = '' as never;
    }
    if (!starter) {
        const starters = startersInfo.saas.starters.filter((e) =>
            e.frameworks.includes(framework),
        );
        if (starters.length > 1) {
            let answer = { name: '' };
            while (!answer.name) {
                answer = await inquirer.prompt<{ name: string }>([
                    {
                        message: 'Select a starter project',
                        name: 'name',
                        type: 'list',
                        choices: starters.map((start) => {
                            return {
                                name: `${start.title}${start.available ? '' : ` (Coming soon)`}`,
                                value: start.slug,
                                disabled: !start.available,
                            };
                        }),
                    },
                ]);
            }
            starter = answer.name as InstanceStarters;
        } else {
            starter = starters[0].slug as InstanceStarters;
        }
    }
    await cli.loginIfRequired();
    console.log('\nCloning starter github repository ...\n');
    const fs = new FS(process.cwd());
    await ChildProcess.spawn(
        `git`,
        [
            'clone',
            'https://github.com/bcms/starters.git',
            '--depth',
            '1',
            `${projectName}-tmp`,
        ],
        { stdio: 'inherit' },
    );
    console.log(`\nCopying project files ...\n`);
    await fs.move([`${projectName}-tmp`, framework, starter], projectName);
    await fs.deleteDir(`${projectName}-tmp`);
    console.log(`\nCreating BCMS Project ...\n`);
    const instance = await cli.sdk.instance.create({
        name: projectName
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map((e) => e.slice(0, 1).toUpperCase() + e.slice(1).toLowerCase())
            .join(' '),
        starter,
        framework,
    });
    console.log('\n Setting up API Keys for the project ...\n');
    const templates = await cli.sdk.template.getAll({
        instanceId: instance._id,
    });
    let apiKeyPrivate = await cli.sdk.apiKey.create({
        instanceId: instance._id,
        data: {
            name: `${projectName} Auto Generated Key - Private`,
            desc: 'Auto generated key from BCMS CLI',
        },
    });
    const apiKeyPublic = await cli.sdk.apiKey.create({
        instanceId: instance._id,
        data: {
            name: `${projectName} Auto Generated Key - Public`,
            desc: 'Auto generated key from BCMS CLI',
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
    const envs: string[] = [
        `BCMS_API_KEY=${apiKeyPrivate._id}.${apiKeyPrivate.secret}.${instance._id}`,
        `# ----`,
        `BCMS_ORG_ID=_none`,
        `BCMS_INSTANCE_ID=${instance._id}`,
        `BCMS_API_KEY_ID=${apiKeyPrivate._id}`,
        `BCMS_API_KEY_SECRET=${apiKeyPrivate.secret}`,
    ];
    if (framework === 'next') {
        envs.push(
            '',
            `# Information about this API Key will be public`,
            `NEXT_PUBLIC_BCMS_API_KEY=${apiKeyPublic._id}.${apiKeyPublic.secret}.${instance._id}`,
            `# ----`,
            `NEXT_PUBLIC_BCMS_ORG_ID=_none`,
            `NEXT_PUBLIC_BCMS_INSTANCE_ID=${instance._id}`,
            `NEXT_PUBLIC_BCMS_API_KEY_ID=${apiKeyPublic._id}`,
            `NEXT_PUBLIC_BCMS_API_KEY_SECRET=${apiKeyPublic.secret}`,
        );
    } else if (framework === 'astro') {
        envs.push(
            '',
            `# Information about this API Key will be public`,
            `PUBLIC_BCMS_API_KEY=${apiKeyPublic._id}.${apiKeyPublic.secret}.${instance._id}`,
            `# ----`,
            `PUBLIC_BCMS_ORG_ID=_none`,
            `PUBLIC_BCMS_INSTANCE_ID=${instance._id}`,
            `PUBLIC_BCMS_API_KEY_ID=${apiKeyPublic._id}`,
            `PUBLIC_BCMS_API_KEY_SECRET=${apiKeyPublic.secret}`,
        );
    } else if (framework === 'nuxt') {
        envs.push(
            '',
            `# Information about this API Key will be public`,
            `NUXT_PUBLIC_BCMS_API_KEY=${apiKeyPublic._id}.${apiKeyPublic.secret}.${instance._id}`,
            `# ----`,
            `NUXT_PUBLIC_BCMS_ORG_ID=_none`,
            `NUXT_PUBLIC_BCMS_INSTANCE_ID=${instance._id}`,
            `NUXT_PUBLIC_BCMS_API_KEY_ID=${apiKeyPublic._id}`,
            `NUXT_PUBLIC_BCMS_API_KEY_SECRET=${apiKeyPublic.secret}`,
        );
    } else if (framework === 'svelte') {
        envs.push(
            '',
            `# Information about this API Key will be public`,
            `PUBLIC_BCMS_API_KEY=${apiKeyPublic._id}.${apiKeyPublic.secret}.${instance._id}`,
            `# ----`,
            `PUBLIC_BCMS_ORG_ID=_none`,
            `PUBLIC_BCMS_INSTANCE_ID=${instance._id}`,
            `PUBLIC_BCMS_API_KEY_ID=${apiKeyPublic._id}`,
            `PUBLIC_BCMS_API_KEY_SECRET=${apiKeyPublic.secret}`,
        );
    }
    await fs.save([projectName, '.env'], envs.join('\n'));
    console.log(
        `\n\nYour BCMS project is available at https://app.thebcms.com/d/i/${instance._id}/bcms`,
    );
    console.log(`\nHappy coding!\n`);
    console.log(`cd ${projectName}`);
    console.log(`npm install`);
    console.log(`npm run dev`);
}
