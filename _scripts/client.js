const path = require('path');
const { createFS } = require('./utils/fs');
const { buildMjs, buildCjs } = require('./utils/build');
const { packageJsonExport } = require('./utils/package-json');

async function buildClient() {
    const basePath = path.join(process.cwd(), 'client');
    const localFs = createFS(basePath);
    if (await localFs.exist(['dist'])) {
        await localFs.deleteDir(['dist']);
    }
    await buildMjs(localFs, basePath, 'build:ts:mjs', 'dist', undefined);
    await buildCjs(localFs, basePath, 'build:ts:cjs', 'dist', undefined);
    const packageJson = JSON.parse(await localFs.readString('package.json'));
    packageJson.devDependencies = undefined;
    packageJson.scripts = undefined;
    let files = await localFs.fileTree(['dist'], '');
    packageJsonExport(files, packageJson);
    await localFs.save(
        ['dist', 'package.json'],
        JSON.stringify(packageJson, null, 4),
    );
}
exports.buildClient = buildClient;
