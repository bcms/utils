#!/usr/bin/env node

import { config } from 'dotenv';
config();
import { type Cli, createCli } from '@thebcms/cli/main';
import type { TypeGeneratorLanguage } from '@thebcms/types';
import { createHandler } from '@thebcms/cli/handlers/create';

async function resolve(cli: Cli) {
    if (cli.args.help) {
        await cli.help();
    } else if (cli.args.login) {
        await cli.login();
    } else if (cli.args.logout) {
        if (await cli.sdk.isLoggedIn()) {
            await cli.sdk.clearAndLogout();
        }
    } else if (cli.args.pull) {
        let thingsToPull = cli.args.pull.split(',');
        if (thingsToPull.includes('all')) {
            thingsToPull = ['types', 'entries', 'media'];
        }
        let instanceInfo: {
            _id: string;
            orgId: string;
        };
        if (cli.client) {
            instanceInfo = {
                _id: cli.client.instanceId,
                orgId: cli.client.orgId,
            };
        } else {
            const instance = await cli.getInstance(cli.args.instanceId);
            instanceInfo = {
                _id: instance._id,
                orgId: instance.orgId,
            };
        }
        for (let i = 0; i < thingsToPull.length; i++) {
            const thingToPull = thingsToPull[i];
            switch (thingToPull) {
                case 'entries':
                    {
                        await cli.entry.pull(
                            instanceInfo._id,
                            instanceInfo.orgId,
                            cli.args.output,
                        );
                    }
                    break;
                case 'media':
                    {
                        await cli.media.pull(
                            instanceInfo._id,
                            instanceInfo.orgId,
                            cli.args.output,
                        );
                    }
                    break;
                case 'types':
                    {
                        let langsToPull: TypeGeneratorLanguage[] = [];
                        if (cli.args.language) {
                            langsToPull = cli.args.language.split(
                                ',',
                            ) as TypeGeneratorLanguage[];
                        } else {
                            langsToPull =
                                await cli.typeGenerator.selectLanguage();
                        }
                        for (let j = 0; j < langsToPull.length; j++) {
                            await cli.typeGenerator.pull(
                                instanceInfo._id,
                                instanceInfo.orgId,
                                langsToPull[j],
                                cli.args.output,
                            );
                        }
                    }
                    break;
                default: {
                    console.error(`Unknown pull type: ${cli.args.pull}`);
                    await cli.help();
                    return;
                }
            }
        }
    } else if (cli.args.create) {
        await createHandler(cli);
    } else {
        throw Error('Unknown command or combination of arguments');
    }
}

async function main() {
    const cli = await createCli();
    await cli.server.start();
    await resolve(cli);
    process.exit(0);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
