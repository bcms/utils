import type { Cli } from '@thebcms/cli';
import inquirer from 'inquirer';
import { getStartersInfo } from '@thebcms/cli/starters-info';
import { FS } from '@thebcms/utils/fs';
import { ChildProcess } from '@thebcms/utils/child-process';
import type { InstanceStarters } from '@thebcms/types';

export async function createHandler(cli: Cli): Promise<void> {
    await cli.loginIfRequired();
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
        starter &&
        !startersInfo.saas.starters.find((e) => e.slug === starter)
    ) {
        starter = '' as never;
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
    console.log('\nGetting organization information ...\n');
    const orgs = await cli.sdk.org.getAll();
    const targetOrg = orgs.find((org) =>
        org.users.find(
            (user) =>
                user.role === 'ORG_OWNER' &&
                user.id === cli.sdk.accessToken?.payload.userId,
        ),
    );
    if (!targetOrg) {
        throw Error('Failed to find organization of which you are owner');
    }
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
        name: projectName,
        orgId: targetOrg._id,
        starter,
    });
    console.log('\n Setting up API Key for the project ...\n');
    const templates = await cli.sdk.template.getAll({
        orgId: instance.orgId,
        instanceId: instance._id,
    });
    let apiKey = await cli.sdk.apiKey.create({
        instanceId: instance._id,
        orgId: instance.orgId,
        data: {
            name: `${projectName} Auto Generated Key`,
            desc: 'Auto generated key from BCMS CLI',
        },
    });
    apiKey = await cli.sdk.apiKey.update({
        orgId: instance.orgId,
        instanceId: instance._id,
        data: {
            _id: apiKey._id,
            access: {
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
    await fs.save(
        [projectName, '.env'],
        [
            `BCMS_ORG_ID=${instance.orgId}`,
            `BCMS_INSTANCE_ID=${instance._id}`,
            `BCMS_API_KEY_ID=${apiKey._id}`,
            `BCMS_API_KEY_SECRET=${apiKey.secret}`,
        ].join('\n'),
    );
    console.log(
        `\n\nYour BCMS project is available at https://app.thebcms.com/d/o/${targetOrg.slug}/i/${instance.slug}/bcms`,
    );
    console.log(`\nHappy coding!\n`);
    console.log(`cd ${projectName}`);
    console.log(`npm install`);
    console.log(`npm run dev`);
}
