const { ChildProcess } = require('./child-process');

/**
 * @param {FS} fs
 * @param {string} basePath
 * @param {string} cmd
 * @param {string} dist
 * @param {undefined | (() => Promise<void>)} afterBuild
 * @return {Promise<void>}
 */
async function buildMjs(fs, basePath, cmd, dist, afterBuild) {
    await ChildProcess.spawn('npm', ['run', cmd], {
        cwd: basePath,
        stdio: 'inherit',
    });
    if (afterBuild) {
        await afterBuild();
    }
    const files = await fs.fileTree([dist, 'mjs'], '');
    for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        if (fileInfo.path.rel.endsWith('.d.ts')) {
            const rPath = fileInfo.path.rel.split('/');
            await fs.move([dist, 'mjs', ...rPath], [dist, ...rPath]);
        } else if (fileInfo.path.rel.endsWith('.js')) {
            await fs.move(
                [dist, 'mjs', ...fileInfo.path.rel.split('/')],
                [dist, ...fileInfo.path.rel.replace('.js', '.mjs').split('/')],
            );
        }
    }
    await fs.deleteDir([dist, 'mjs']);
}
exports.buildMjs = buildMjs;

/**
 * @param {FS} fs
 * @param {string} basePath
 * @param {string} cmd
 * @param {string} dist
 * @param {undefined | (() => Promise<void>)} afterBuild
 * @return {Promise<void>}
 */
async function buildMjsx(fs, basePath, cmd, dist, afterBuild) {
    await ChildProcess.spawn('npm', ['run', cmd], {
        cwd: basePath,
        stdio: 'inherit',
    });
    if (afterBuild) {
        await afterBuild();
    }
    const files = await fs.fileTree([dist, 'mjs'], '');
    for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        if (fileInfo.path.rel.endsWith('.d.ts')) {
            const rPath = fileInfo.path.rel.split('/');
            await fs.move([dist, 'mjs', ...rPath], [dist, ...rPath]);
        } else if (fileInfo.path.rel.endsWith('.js')) {
            await fs.move(
                [dist, 'mjs', ...fileInfo.path.rel.split('/')],
                [dist, ...fileInfo.path.rel.replace('.js', '.mjs').split('/')],
            );
        } else if (fileInfo.path.rel.endsWith('.jsx')) {
            await fs.move(
                [dist, 'mjs', ...fileInfo.path.rel.split('/')],
                [dist, ...fileInfo.path.rel.split('/')],
            );
        }
    }
    await fs.deleteDir([dist, 'mjs']);
}
exports.buildMjsx = buildMjsx;

/**
 * @param {FS} fs
 * @param {string} basePath
 * @param {string} cmd
 * @param {string} dist
 * @param {undefined | (() => Promise<void>)} afterBuild
 * @return {Promise<void>}
 */
async function buildCjs(fs, basePath, cmd, dist, afterBuild) {
    await ChildProcess.spawn('npm', ['run', cmd], {
        cwd: basePath,
        stdio: 'inherit',
    });
    if (afterBuild) {
        await afterBuild();
    }
    const files = await fs.fileTree([dist, 'cjs'], '');
    for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        if (fileInfo.path.rel.endsWith('.js')) {
            await fs.move(
                [dist, 'cjs', ...fileInfo.path.rel.split('/')],
                [dist, ...fileInfo.path.rel.replace('.js', '.cjs').split('/')],
            );
        }
    }
    await fs.deleteDir([dist, 'cjs']);
}
exports.buildCjs = buildCjs;
