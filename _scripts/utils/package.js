const path = require('path');
const { ChildProcess } = require('./child-process');

/**
 * @param {string[]} basePath
 * @return {Promise<void>}
 */
async function createPackage(basePath) {
    await ChildProcess.advancedExec('npm pack', {
        cwd: path.join(process.cwd(), ...basePath),
        onChunk(type, chunk) {
            process[type].write(chunk);
        },
    }).awaiter;
}
exports.createPackage = createPackage;
