const path = require('path');
const { ChildProcess } = require('./child-process');

/**
 * @param {string[]} basePath
 * @return {Promise<void>}
 */
async function publish(basePath) {
    await ChildProcess.spawn('npm', ['publish', '--access', 'public'], {
        cwd: path.join(process.cwd(), ...basePath),
        stdio: 'inherit',
    });
}
exports.publish = publish;
