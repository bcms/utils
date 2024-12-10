const path = require('path');
const { createFS } = require('./utils/fs');
const { buildCjs, buildMjs } = require('./utils/build');
const { packageJsonExport } = require('./utils/package-json');
const { getClientVersion } = require('./utils/version');

async function buildComponentsReact() {
    const basePath = path.join(process.cwd(), 'components', 'react');
    const localFs = createFS(basePath);
    if (await localFs.exist(['dist'])) {
        await localFs.deleteDir(['dist']);
    }
    await buildMjs(localFs, basePath, 'build:ts:mjs', 'dist', async () => {
        const delDirs = ['client'];
        for (let i = 0; i < delDirs.length; i++) {
            const delDir = delDirs[i];
            await localFs.deleteDir(['dist', 'mjs', delDir]);
        }
        const files = await localFs.fileTree(
            ['dist', 'mjs', 'components', 'react', 'src'],
            '',
        );
        for (let i = 0; i < files.length; i++) {
            const fileInfo = files[i];
            await localFs.move(
                [
                    'dist',
                    'mjs',
                    'components',
                    'react',
                    'src',
                    fileInfo.path.rel,
                ],
                ['dist', 'mjs', fileInfo.path.rel],
            );
        }
    });
    await buildCjs(localFs, basePath, 'build:ts:cjs', 'dist', async () => {
        const delDirs = ['client'];
        for (let i = 0; i < delDirs.length; i++) {
            const delDir = delDirs[i];
            await localFs.deleteDir(['dist', 'cjs', delDir]);
        }
        const files = await localFs.fileTree(
            ['dist', 'cjs', 'components', 'react', 'src'],
            '',
        );
        for (let i = 0; i < files.length; i++) {
            const fileInfo = files[i];
            await localFs.move(
                [
                    'dist',
                    'cjs',
                    'components',
                    'react',
                    'src',
                    fileInfo.path.rel,
                ],
                ['dist', 'cjs', fileInfo.path.rel],
            );
        }
    });
    const packageJson = JSON.parse(await localFs.readString('package.json'));
    packageJson.devDependencies = undefined;
    packageJson.scripts = undefined;
    const [_clientName, clientVersion] = await getClientVersion();
    packageJson.peerDependencies['@thebcms/client'] = `^${clientVersion}`;
    let files = await localFs.fileTree(['dist'], '');
    packageJsonExport(files, packageJson);
    await localFs.save(
        ['dist', 'package.json'],
        JSON.stringify(packageJson, null, 4),
    );
}
exports.buildComponentsReact = buildComponentsReact;
