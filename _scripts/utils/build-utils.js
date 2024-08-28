const { ChildProcess } = require('./child-process');

/**
 * @param {string} basePath
 * @param {FS} localFs
 * @return {Promise<void>}
 */
async function buildMjs(basePath, localFs) {
    await ChildProcess.spawn('npm', ['run', 'build:ts:mjs'], {
        cwd: basePath,
        stdio: 'inherit',
    });
    const files = await localFs.fileTree(['dist', 'mjs'], '');
    for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        if (fileInfo.path.rel.endsWith('.d.ts')) {
            const rPath = fileInfo.path.rel.split('/');
            await localFs.move(['dist', 'mjs', ...rPath], ['dist', ...rPath]);
        } else if (fileInfo.path.rel.endsWith('.js')) {
            await localFs.move(
                ['dist', 'mjs', ...fileInfo.path.rel.split('/')],
                [
                    'dist',
                    ...fileInfo.path.rel.replace('.js', '.mjs').split('/'),
                ],
            );
        }
    }
    await localFs.deleteDir(['dist', 'mjs']);
}
exports.buildMjs = buildMjs;

/**
 * @param {string} basePath
 * @param {FS} localFs
 * @return {Promise<void>}
 */
async function buildMjsx(basePath, localFs) {
    await ChildProcess.spawn('npm', ['run', 'build:ts:mjs'], {
        cwd: basePath,
        stdio: 'inherit',
    });
    const files = await localFs.fileTree(['dist', 'mjs'], '');
    for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        if (fileInfo.path.rel.endsWith('.d.ts')) {
            const rPath = fileInfo.path.rel.split('/');
            await localFs.move(['dist', 'mjs', ...rPath], ['dist', ...rPath]);
        } else if (fileInfo.path.rel.endsWith('.jsx')) {
            await localFs.move(
                ['dist', 'mjs', ...fileInfo.path.rel.split('/')],
                ['dist', ...fileInfo.path.rel.split('/')],
            );
        } else if (fileInfo.path.rel.endsWith('.js')) {
            await localFs.move(
                ['dist', 'mjs', ...fileInfo.path.rel.split('/')],
                [
                    'dist',
                    ...fileInfo.path.rel.replace('.js', '.mjs').split('/'),
                ],
            );
        }
    }
    await localFs.deleteDir(['dist', 'mjs']);
}
exports.buildMjsx = buildMjsx;

/**
 * @param {string} basePath
 * @param {FS} localFs
 * @return {Promise<void>}
 */
async function buildCjs(basePath, localFs) {
    await ChildProcess.spawn('npm', ['run', 'build:ts:cjs'], {
        cwd: basePath,
        stdio: 'inherit',
    });
    const files = await localFs.fileTree(['dist', 'cjs'], '');
    for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        if (fileInfo.path.rel.endsWith('.js')) {
            await localFs.move(
                ['dist', 'cjs', ...fileInfo.path.rel.split('/')],
                [
                    'dist',
                    ...fileInfo.path.rel.replace('.js', '.cjs').split('/'),
                ],
            );
        }
    }
    await localFs.deleteDir(['dist', 'cjs']);
}
exports.buildCjs = buildCjs;
