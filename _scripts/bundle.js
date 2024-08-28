const path = require('path');
const { getArgs } = require('./utils/args');
const { createFS } = require('./utils/fs');
const { buildCjs, buildMjs } = require('./utils/build-utils');

const availablePackages = [
    'client',
    'cli',
    'components/react',
    'components/vue',
];
exports.availablePackages = availablePackages;

async function bundlePackage() {
    const args = getArgs();
    const packageName = args.name;
    if (!availablePackages.includes(packageName)) {
        throw Error(`Package ${packageName} is not known`);
    }
    const basePath = path.join(process.cwd(), ...packageName.split('/'));
    const localFs = createFS(basePath);
    if (await localFs.exist('dist')) {
        await localFs.deleteDir('dist');
    }
    if (packageName === 'client') {
        await buildMjs(basePath, localFs);
        await buildCjs(basePath, localFs);
        await localFs.deleteDir(['dist', 'test']);
        await localFs.copy(['..', '_cloud-types'], ['dist', 'types', '_cloud']);
        const cloudFileNames = await localFs.fileTree(
            ['dist', 'types', '_cloud'],
            '',
        );
        const cloudIndexImports = [];
        for (let i = 0; i < cloudFileNames.length; i++) {
            const fileName = cloudFileNames[i];
            if (
                fileName.path.rel.includes('index.d.ts') ||
                fileName.path.rel === '_server/_modules/socket/main.d.ts'
            ) {
                continue;
            }
            cloudIndexImports.push(
                `export * from './${fileName.path.rel.replace('.d.ts', '')}';`,
            );
        }
        await localFs.save(
            ['dist', 'types', '_cloud', 'index.d.ts'],
            cloudIndexImports.join('\n'),
        );
        await localFs.save(
            ['dist', 'types', 'index.d.ts'],
            (await localFs.readString(['dist', 'types', 'index.d.ts'])) +
                `\nexport * from './_cloud';`,
        );
        await localFs.copy('README.md', ['dist', 'README.md']);
        await localFs.copy('LICENSE', ['dist', 'LICENSE']);
    } else if (packageName === 'cli') {
        await buildMjs(basePath, localFs);
        await localFs.copy('README.md', ['dist', 'README.md']);
        await localFs.copy(
            ['src', 'server', 'html'],
            ['dist', 'server', 'html'],
        );
    } else {
        await buildMjs(basePath, localFs);
        await buildCjs(basePath, localFs);
        await localFs.copy('README.md', ['dist', 'README.md']);
    }
    const packageJson = JSON.parse(await localFs.readString('package.json'));
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
        packageJson.exports['.'].import = './index.mjs';
    }
    let files = await localFs.fileTree(['dist'], '');
    for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        if (
            fileInfo.path.rel !== 'index.cjs' &&
            fileInfo.path.rel !== 'index.mjs' &&
            fileInfo.path.rel !== 'index.jsx' &&
            (fileInfo.path.rel.endsWith('.cjs') ||
                fileInfo.path.rel.endsWith('.mjs') ||
                fileInfo.path.rel.endsWith('.jsx'))
        ) {
            const exportName =
                './' +
                fileInfo.path.rel
                    .replace('/index.cjs', '')
                    .replace('/index.mjs', '')
                    .replace('/index.jsx', '')
                    .replace('.mjs', '')
                    .replace('.jsx', '')
                    .replace('.cjs', '');
            if (!packageJson.exports[exportName]) {
                packageJson.exports[exportName] = {};
            }
            if (
                fileInfo.path.rel.endsWith('.mjs') ||
                fileInfo.path.rel.endsWith('.jsx')
            ) {
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
}
exports.bundlePackage = bundlePackage;
