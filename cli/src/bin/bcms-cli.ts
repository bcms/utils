#!/usr/bin/env node

import { config } from 'dotenv';
config();
import { Cli, createCli } from '@thebcms/cli/main';
import type { TypeGeneratorLanguage } from '@thebcms/sdk';

async function resolve(cli: Cli) {
    if (cli.args.pull) {
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
    } else {
        await cli.help();
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
