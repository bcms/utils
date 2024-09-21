const { createFS } = require('./fs');

/**
 * @param {string[]} path
 * @return {Promise<[string, string]>}
 */
async function getPackageNameAndVersion(path) {
    const fs = new createFS(process.cwd());
    const packageJson = JSON.parse(await fs.readString(path));
    return [packageJson.name, packageJson.version];
}

async function getCliVersion() {
    return await getPackageNameAndVersion(['cli', 'package.json']);
}

async function getClientVersion() {
    return await getPackageNameAndVersion(['client', 'package.json']);
}

async function getComponentsReactVersion() {
    return await getPackageNameAndVersion([
        'components',
        'react',
        'package.json',
    ]);
}

async function getComponentsVueVersion() {
    return await getPackageNameAndVersion([
        'components',
        'vue',
        'package.json',
    ]);
}

exports.getCliVersion = getCliVersion;
exports.getClientVersion = getClientVersion;
exports.getComponentsReactVersion = getComponentsReactVersion;
exports.getComponentsVueVersion = getComponentsVueVersion;
