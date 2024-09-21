const path = require('path');
const { buildMjs, buildCjs } = require('./utils/build');
const { packageJsonExport } = require('./utils/package-json');
const { createFS } = require('./utils/fs');
const { getClientVersion } = require('./utils/version');

async function buildCli() {
    const basePath = path.join(process.cwd(), 'cli');
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
        const files = await localFs.fileTree(['dist', 'mjs', 'cli', 'src'], '');
        for (let i = 0; i < files.length; i++) {
            const fileInfo = files[i];
            await localFs.move(
                ['dist', 'mjs', 'cli', 'src', fileInfo.path.rel],
                ['dist', 'mjs', fileInfo.path.rel],
            );
        }
    });
    const packageJson = JSON.parse(await localFs.readString('package.json'));
    const clientV = await getClientVersion();
    packageJson.dependencies[clientV[0]] = clientV[1];
    packageJson.devDependencies = undefined;
    packageJson.scripts = undefined;
    let files = await localFs.fileTree(['dist'], '');
    packageJsonExport(files, packageJson);
    await localFs.save(
        ['dist', 'package.json'],
        JSON.stringify(packageJson, null, 4),
    );
}

exports.buildCli = buildCli;
