const path = require('path');
const { createFS } = require('./utils/fs');

async function buildComponentsSvelte() {
    const basePath = path.join(process.cwd(), 'components', 'svelte');
    const localFs = createFS(basePath);
    if (await localFs.exist(['dist'])) {
        await localFs.deleteDir(['dist']);
    }
    await localFs.copy('src', 'dist');
    const packageJson = JSON.parse(await localFs.readString('package.json'));
    packageJson.devDependencies = undefined;
    packageJson.scripts = undefined;
    await localFs.save(
        ['dist', 'package.json'],
        JSON.stringify(packageJson, null, 4),
    );
}
exports.buildComponentsSvelte = buildComponentsSvelte;
