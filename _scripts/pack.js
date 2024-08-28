const { getArgs } = require('./utils/args');
const { availablePackages } = require('./bundle');
const path = require('path');
const { createFS } = require('./utils/fs');
const { ChildProcess } = require('./utils/child-process');

async function packPackage() {
    const args = getArgs();
    const packageName = args.name;
    if (!availablePackages.includes(packageName)) {
        throw Error(`Package ${packageName} is not known`);
    }
    const basePath = path.join(process.cwd(), ...packageName.split('/'));
    const localFs = createFS(basePath);
    const packageJson = JSON.parse(await localFs.readString('package.json'));
    const tgzName = `thebcms-${packageName.replace(/\//g, '-')}-${packageJson.version}.tgz`;
    if (await localFs.exist(['dist', tgzName], true)) {
        await localFs.deleteFile(['dist', tgzName]);
    }
    await ChildProcess.spawn('npm', ['pack'], {
        cwd: path.join(process.cwd(), ...packageName.split('/'), 'dist'),
        stdio: 'inherit',
    });
}
exports.packPackage = packPackage;
