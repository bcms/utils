import { type Args, argsMap, getArgs } from '@thebcms/cli/args';
import { sdkCreate } from '@thebcms/cli/sdk';
import { Server } from '@thebcms/cli/server/main';
import inquirer from 'inquirer';
import path from 'path';
import { homedir, platform } from 'os';
import { TypeGeneratorHandler } from '@thebcms/cli/handlers';
import { EntryHandler } from '@thebcms/cli/handlers/entry';
import { MediaHandler } from '@thebcms/cli/handlers/media';
import { type BCMSConfig, BCMSConfigSchema } from '@thebcms/cli/config';
import * as process from 'node:process';
import { FS } from '@thebcms/utils/fs';
import type { Sdk } from '@thebcms/sdk';
import { Client } from '@thebcms/client';
import type { Instance } from '@thebcms/types';
import {
    ObjectUtility,
    ObjectUtilityError,
} from '@thebcms/utils/object-utility';

export class Cli {
    server = new Server();
    apiOrigin = '';
    rootFs = new FS(path.join(homedir(), '.bcms'));
    localFs = new FS(process.cwd());

    typeGenerator = new TypeGeneratorHandler(this);
    entry = new EntryHandler(this);
    media = new MediaHandler(this);

    constructor(
        public args: Args,
        public sdk: Sdk,
        public client?: Client,
    ) {
        this.apiOrigin = args.apiOrigin
            ? args.apiOrigin
            : 'https://app.thebcms.com';
    }

    async getVersion() {
        let packageJson: any = null;
        if (await this.rootFs.exist([__dirname, 'package.json'], true)) {
            packageJson = JSON.parse(
                await this.rootFs.readString([__dirname, 'package.json']),
            );
        } else if (
            await this.rootFs.exist([__dirname, '..', 'package.json'], true)
        ) {
            packageJson = JSON.parse(
                await this.rootFs.readString([__dirname, '..', 'package.json']),
            );
        }
        if (!packageJson) {
            throw Error('Failed to get version');
        }
        return packageJson.version;
    }

    async help() {
        console.log('---- BCMS CLI ----\n');
        const cols: Array<[string, string[]]> = [];
        let col1MaxWidth = 0;
        for (const key in argsMap) {
            const argInfo = argsMap[key];
            const col1 = argInfo.flags.join(', ');
            if (col1MaxWidth < col1.length) {
                col1MaxWidth = col1.length;
            }
            const col2Lines: string[] = [''];
            let col2LineIdx = 0;
            if (argInfo.description) {
                const descParts = argInfo.description.split(' ');
                for (let i = 0; i < descParts.length; i++) {
                    const word = descParts[i];
                    if (col2Lines[col2LineIdx].length === 0) {
                        col2Lines[col2LineIdx] += word;
                    } else {
                        col2Lines[col2LineIdx] += ' ' + word;
                    }
                    if (col2Lines[col2LineIdx].length > 30) {
                        col2Lines.push('');
                        col2LineIdx++;
                    }
                }
            }
            cols.push([col1, col2Lines]);
        }
        for (let i = 0; i < cols.length; i++) {
            const col = cols[i];
            const delta = Array(col1MaxWidth - col[0].length)
                .map(() => '')
                .join(' ');
            const lineIndent = Array(col[0].length + delta.length + 5)
                .map(() => '')
                .join(' ');
            console.log(delta + col[0], '->', col[1][0]);
            for (let j = 1; j < col[1].length; j++) {
                console.log(lineIndent + col[1][j]);
            }
        }
    }

    async loginIfRequired() {
        if (!this.client && !(await this.sdk.isLoggedIn())) {
            await this.login();
        } else {
            try {
                await this.sdk.org.getAll();
            } catch (err) {
                await this.login();
            }
        }
    }

    async login() {
        try {
            if (await this.sdk.isLoggedIn()) {
                return;
            }
        } catch (err) {
            // Ignore and relogin
        }
        if (this.args.loginOtp && this.args.userId) {
            await this.sdk.auth.loginOtp({
                userId: this.args.userId,
                otp: this.args.loginOtp,
            });
            console.log('You are now logged in');
        } else {
            console.log(
                'Open the URL in your browser to login: ' +
                    `${this.apiOrigin}?cb=cli&host=${encodeURIComponent(`http://localhost:${this.server.port}/login-callback`)}`,
            );
            const data = await this.server.awaitForLoginCallback();
            await this.sdk.auth.loginOtp({
                userId: data.userId,
                otp: data.otp,
            });
            console.log('You are now logged in');
        }
    }

    async getInstance(
        instanceId?: string,
        promptMessage?: string,
    ): Promise<Instance> {
        if (await this.localFs.exist(['bcms', 'active-instance.json'], true)) {
            return await JSON.parse(
                await this.localFs.readString(['bcms', 'active-instance.json']),
            );
        }
        const instances = await this.sdk.instance.getAll();
        if (instanceId) {
            const instance = instances.find((e) => e._id === instanceId);
            if (instance) {
                return instance;
            }
        }
        const answers = await inquirer.prompt<{
            instanceId: string;
            remember: boolean;
        }>([
            {
                message: promptMessage || 'Select an instance',
                type: 'list',
                name: 'instanceId',
                choices: instances.map((instance) => {
                    return {
                        name: instance.name,
                        value: instance._id,
                    };
                }),
            },
            {
                message:
                    'Would you like to remember this answer for future' +
                    ' use in this project?',
                type: 'confirm',
                name: 'remember',
            },
        ]);
        const instance = instances.find((e) => e._id === answers.instanceId);
        if (!instance) {
            throw Error(`Failed to get instance with ID ${answers.instanceId}`);
        }
        if (answers.remember) {
            await this.localFs.save(
                ['bcms', 'active-instance.json'],
                JSON.stringify(instance, null, 4),
            );
        }
        return instance;
    }
}

export async function createCli() {
    let config: BCMSConfig | null = null;
    const tryConfigFiles = [
        'bcms.config.js',
        'bcms.config.cjs',
        'bcms.config.mjs',
    ];
    for (let i = 0; i < tryConfigFiles.length; i++) {
        const configPath =
            platform() === 'win32'
                ? `${process.cwd().replace(/\\/g, '/').split(':')[1]}/${tryConfigFiles[i]}`
                : `${process.cwd()}/${tryConfigFiles[i]}`;
        try {
            config = ((await import(configPath)) as any).default;
            break;
        } catch (err) {
            // Ignore
        }
    }
    let client: Client | undefined = undefined;
    if (config) {
        const checkConfig = ObjectUtility.compareWithSchema(
            config,
            BCMSConfigSchema,
            'bcms.config',
        );
        if (checkConfig instanceof ObjectUtilityError) {
            throw Error(checkConfig.message);
        }
        if (config.client) {
            client = new Client(
                config.client.orgId,
                config.client.instanceId,
                {
                    id: config.client.apiKey.id,
                    secret: config.client.apiKey.secret,
                },
                {
                    cmsOrigin:
                        config.client.origin || 'https://app.thebcms.com',
                    useMemCache: true,
                    injectSvg: true,
                },
            );
        }
    }
    const args = getArgs();
    const sdk = await sdkCreate(
        args.apiOrigin ? args.apiOrigin : 'https://app.thebcms.com',
        args.verbose,
    );
    return new Cli(args, sdk, client);
}
