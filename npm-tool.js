const path = require('path');
const { config } = require('dotenv');
config({
    path: path.join(process.cwd(), 'backend', '.env'),
});
const { createFS } = require('@banez/fs');
const { ChildProcess } = require('@banez/child_process');
const { createConfig, createTasks } = require('@banez/npm-tool');
const { StringUtility } = require('@banez/string-utility');

const fs = createFS({
    base: process.cwd(),
});
const availablePackages = ['client', 'cli', 'components/next'];

/**
 *
 * @param {{
 *  dirPath: string;
 *  basePath: string;
 *  endsWith?: string[];
 *  regex: RegExp[];
 * }} config
 * @returns {Promise<void>}
 */
async function fileReplacer(config) {
    const filePaths = await fs.fileTree(config.dirPath, '');
    for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        if (
            config.endsWith &&
            !!config.endsWith.find((e) => filePath.path.abs.endsWith(e))
        ) {
            let replacer = config.basePath;
            if (filePath.dir !== '') {
                const depth = filePath.dir.split('/').length;
                replacer =
                    new Array(depth).fill('..').join('/') +
                    '/' +
                    config.basePath;
            }
            const file = await fs.readString(filePath.path.abs);
            let fileFixed = file + '';
            for (let j = 0; j < config.regex.length; j++) {
                const regex = config.regex[j];
                fileFixed = fileFixed.replace(regex, replacer);
            }
            if (file !== fileFixed) {
                await fs.save(filePath.path.abs, fileFixed);
            }
        }
    }
}

module.exports = createConfig({
    custom: {
        '--postinstall': async () => {
            await ChildProcess.spawn('npm', ['i'], {
                cwd: path.join(process.cwd(), 'client'),
                env: process.env,
                stdio: 'inherit',
            });
            await ChildProcess.spawn('npm', ['i'], {
                cwd: path.join(process.cwd(), 'plugin', 'next'),
                env: process.env,
                stdio: 'inherit',
            });
            await ChildProcess.spawn('npm', ['run', 'setup']);
        },

        '--setup': async () => {
            const dirs = [];
            for (let i = 0; i < dirs.length; i++) {
                const dir = dirs[i];
                if (!(await fs.exist(dir))) {
                    await fs.mkdir(dir);
                }
            }
            const files = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!(await fs.exist(file, true))) {
                    await fs.save(file, '');
                }
            }
        },

        '--pre-commit': async () => {
            const whatToCheck = {
                client: false,
                most: false,
                pluginNext: false,
            };
            let gitOutput = '';
            await ChildProcess.advancedExec('git status', {
                cwd: process.cwd(),
                doNotThrowError: true,
                onChunk(type, chunk) {
                    gitOutput += chunk;
                    process[type].write(chunk);
                },
            }).awaiter;
            const paths = StringUtility.allTextBetween(gitOutput, '   ', '\n');
            for (let i = 0; i < paths.length; i++) {
                const p = paths[i];
                if (p.startsWith('client/')) {
                    whatToCheck.client = true;
                } else if (p.startsWith('most/')) {
                    whatToCheck.most = true;
                } else if (p.startsWith('plugin/next')) {
                    whatToCheck.pluginNext = true;
                }
            }
            if (whatToCheck.client) {
                await ChildProcess.spawn('npm', ['run', 'lint'], {
                    cwd: path.join(process.cwd(), 'client'),
                    stdio: 'inherit',
                });
                await ChildProcess.spawn('npm', ['run', 'build:noEmit'], {
                    cwd: path.join(process.cwd(), 'client'),
                    stdio: 'inherit',
                });
            }
            if (whatToCheck.most) {
                await ChildProcess.spawn('npm', ['run', 'lint'], {
                    cwd: path.join(process.cwd(), 'most'),
                    stdio: 'inherit',
                });
                await ChildProcess.spawn('npm', ['run', 'build:noEmit'], {
                    cwd: path.join(process.cwd(), 'most'),
                    stdio: 'inherit',
                });
            }
            if (whatToCheck.pluginNext) {
                await ChildProcess.spawn('npm', ['run', 'lint'], {
                    cwd: path.join(process.cwd(), 'plugin', 'next'),
                    stdio: 'inherit',
                });
                await ChildProcess.spawn('npm', ['run', 'build:noEmit'], {
                    cwd: path.join(process.cwd(), 'plugin', 'next'),
                    stdio: 'inherit',
                });
            }
        },

        '--pack-package': async ({ args }) => {
            const packageName = args['--name'];
            if (!availablePackages.includes(packageName)) {
                throw Error(`Package ${packageName} is not known`);
            }
            const basePath = path.join(
                process.cwd(),
                ...packageName.split('/'),
            );
            const localFs = createFS({
                base: basePath,
            });
            const packageJson = JSON.parse(
                await localFs.readString('package.json'),
            );
            switch (packageName) {
                case 'client':
                    {
                        const tgzName = `thebcms-client-${packageJson.version}.tgz`;
                        if (await localFs.exist(['dist', tgzName], true)) {
                            await localFs.deleteFile(['dist', tgzName]);
                        }
                        await ChildProcess.spawn('npm', ['pack'], {
                            cwd: path.join(process.cwd(), 'client', 'dist'),
                            stdio: 'inherit',
                        });
                        await localFs.copy(
                            ['dist', tgzName],
                            ['..', 'components', 'next', 'client.tgz'],
                        );
                        await ChildProcess.spawn(
                            'npm',
                            ['i', '-D', './client.tgz'],
                            {
                                cwd: path.join(
                                    process.cwd(),
                                    'components',
                                    'next',
                                ),
                                stdio: 'inherit',
                            },
                        );
                    }
                    break;
                default: {
                    const tgzName = `thebcms-${packageName.replace(/\//g, '-')}-${packageJson.version}.tgz`;
                    if (await localFs.exist(['dist', tgzName], true)) {
                        await localFs.deleteFile(['dist', tgzName]);
                    }
                    await ChildProcess.spawn('npm', ['pack'], {
                        cwd: path.join(
                            process.cwd(),
                            ...packageName.split('/'),
                            'dist',
                        ),
                        stdio: 'inherit',
                    });
                }
            }
        },

        '--bundle-package': async ({ args }) => {
            const packageName = args['--name'];
            if (!availablePackages.includes(packageName)) {
                throw Error(`Package ${packageName} is not known`);
            }
            const basePath = path.join(
                process.cwd(),
                ...packageName.split('/'),
            );
            const localFs = createFS({
                base: basePath,
            });
            /**
             * @type {import('@banez/npm-tool/types').Task[]}
             */
            const tasks = [
                {
                    title: 'Cleanup',
                    task: async () => {
                        if (await localFs.exist('dist')) {
                            await localFs.deleteDir('dist');
                        }
                    },
                },
                {
                    title: 'Build MJS',
                    task: async () => {
                        await ChildProcess.spawn(
                            'npm',
                            ['run', 'build:ts:mjs'],
                            {
                                cwd: basePath,
                                stdio: 'inherit',
                            },
                        );
                        const files = await localFs.fileTree(
                            ['dist', 'mjs'],
                            '',
                        );
                        // await fileReplacer({
                        //     basePath: '',
                        //     dirPath: ['dist', 'mjs'],
                        //     regex: [/@becomes\/cms-client\//g],
                        //     endsWith: ['.js', '.d.ts'],
                        // });
                        for (let i = 0; i < files.length; i++) {
                            const fileInfo = files[i];
                            if (fileInfo.path.rel.endsWith('.d.ts')) {
                                const rPath = fileInfo.path.rel.split('/');
                                await localFs.move(
                                    ['dist', 'mjs', ...rPath],
                                    ['dist', ...rPath],
                                );
                            } else if (fileInfo.path.rel.endsWith('.js')) {
                                await localFs.move(
                                    [
                                        'dist',
                                        'mjs',
                                        ...fileInfo.path.rel.split('/'),
                                    ],
                                    [
                                        'dist',
                                        ...fileInfo.path.rel
                                            .replace('.js', '.mjs')
                                            .split('/'),
                                    ],
                                );
                            }
                        }
                        await localFs.deleteDir(['dist', 'mjs']);
                    },
                },
                {
                    title: 'Build CJS',
                    task: async () => {
                        if (packageName === 'cli') {
                            return;
                        }
                        await ChildProcess.spawn(
                            'npm',
                            ['run', 'build:ts:cjs'],
                            {
                                cwd: basePath,
                                stdio: 'inherit',
                            },
                        );
                        // await fileReplacer({
                        //     basePath: '',
                        //     dirPath: ['dist', 'cjs'],
                        //     regex: [/@becomes\/cms-client\//g],
                        //     endsWith: ['.js'],
                        // });
                        const files = await localFs.fileTree(
                            ['dist', 'cjs'],
                            '',
                        );
                        for (let i = 0; i < files.length; i++) {
                            const fileInfo = files[i];
                            if (fileInfo.path.rel.endsWith('.js')) {
                                await localFs.move(
                                    [
                                        'dist',
                                        'cjs',
                                        ...fileInfo.path.rel.split('/'),
                                    ],
                                    [
                                        'dist',
                                        ...fileInfo.path.rel
                                            .replace('.js', '.cjs')
                                            .split('/'),
                                    ],
                                );
                            }
                        }
                        await localFs.deleteDir(['dist', 'cjs']);
                    },
                },
            ];
            if (packageName === 'client') {
                tasks.push({
                    title: 'Copy static files',
                    task: async () => {
                        await localFs.deleteDir(['dist', 'test']);
                        await localFs.copy(
                            ['..', '_cloud-types'],
                            ['dist', 'types', '_cloud'],
                        );
                        const cloudFileNames = await localFs.readdir([
                            'dist',
                            'types',
                            '_cloud',
                        ]);
                        const cloudIndexImports = [];
                        for (let i = 0; i < cloudFileNames.length; i++) {
                            const fileName = cloudFileNames[i];
                            cloudIndexImports.push(
                                `export * from './${fileName.replace('.d.ts', '')}';`,
                            );
                        }
                        await localFs.save(
                            ['dist', 'types', '_cloud', 'index.d.ts'],
                            cloudIndexImports.join('\n'),
                        );
                        await localFs.save(
                            ['dist', 'types', 'index.d.ts'],
                            (await localFs.readString([
                                'dist',
                                'types',
                                'index.d.ts',
                            ])) + `\nexport * from './_cloud';`,
                        );
                        await localFs.copy('README.md', ['dist', 'README.md']);
                        await localFs.copy('LICENSE', ['dist', 'LICENSE']);
                    },
                });
            } else if (packageName === 'cli') {
                tasks.push({
                    title: 'Copy static files',
                    task: async () => {
                        await localFs.copy('README.md', ['dist', 'README.md']);
                        await localFs.copy(
                            ['src', 'server', 'html'],
                            ['dist', 'server', 'html'],
                        );
                    },
                });
            } else {
                tasks.push({
                    title: 'Copy static files',
                    task: async () => {
                        await localFs.copy('README.md', ['dist', 'README.md']);
                    },
                });
            }
            tasks.push({
                title: 'Update package.json',
                task: async () => {
                    const packageJson = JSON.parse(
                        await localFs.readString('package.json'),
                    );
                    packageJson.devDependencies = undefined;
                    packageJson.scripts = {};
                    packageJson.exports = {};
                    if (await localFs.exist(['dist', 'index.cjs'], true)) {
                        if (!packageJson.exports['.']) {
                            packageJson.exports['.'] = {};
                        }
                        packageJson.exports['.'].require = './index.cjs';
                    }
                    if (await localFs.exist(['dist', 'index.mjs'], true)) {
                        if (!packageJson.exports['.']) {
                            packageJson.exports['.'] = {};
                        }
                        packageJson.exports['.'].import = './index.cjs';
                    }
                    let files = await localFs.fileTree(['dist'], '');
                    for (let i = 0; i < files.length; i++) {
                        const fileInfo = files[i];
                        if (
                            fileInfo.path.rel !== 'index.cjs' &&
                            fileInfo.path.rel !== 'index.mjs' &&
                            (fileInfo.path.rel.endsWith('.cjs') ||
                                fileInfo.path.rel.endsWith('.mjs'))
                        ) {
                            const exportName =
                                './' +
                                fileInfo.path.rel
                                    .replace('/index.cjs', '')
                                    .replace('/index.mjs', '')
                                    .replace('.mjs', '')
                                    .replace('.cjs', '');
                            if (!packageJson.exports[exportName]) {
                                packageJson.exports[exportName] = {};
                            }
                            if (fileInfo.path.rel.endsWith('.mjs')) {
                                packageJson.exports[exportName].import =
                                    './' + fileInfo.path.rel;
                            }
                            if (fileInfo.path.rel.endsWith('.cjs')) {
                                packageJson.exports[exportName].require =
                                    './' + fileInfo.path.rel;
                            }
                        }
                    }
                    await localFs.save(
                        ['dist', 'package.json'],
                        JSON.stringify(packageJson, null, 4),
                    );
                },
            });
            await createTasks(tasks).run();
        },
    },
});
