#!/usr/bin/env node

import { Cli, createCli } from '@thebcms/cli/main';
import type { TypeGeneratorLanguage } from '@thebcms/sdk';

async function resolve(cli: Cli) {
    if (cli.args.pull) {
        await cli.login();
        let thingsToPull = cli.args.pull.split(',');
        if (thingsToPull.includes('all')) {
            thingsToPull = ['types', 'entries', 'media'];
        }
        const instance = await cli.getInstance(cli.args.instanceId);
        for (let i = 0; i < thingsToPull.length; i++) {
            const thingToPull = thingsToPull[i];
            switch (thingToPull) {
                case 'entries':
                    {
                        await cli.entry.pull(
                            instance._id,
                            instance.orgId,
                            cli.args.output,
                        );
                    }
                    break;
                case 'media':
                    {
                        await cli.media.pull(
                            instance._id,
                            instance.orgId,
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
                                instance._id,
                                instance.orgId,
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
