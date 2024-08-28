const { ChildProcess } = require('./utils/child-process');
const path = require('path');
const { setup } = require('./setup');

async function postinstall() {
    await ChildProcess.spawn('npm', ['i'], {
        cwd: path.join(process.cwd(), 'client'),
        env: process.env,
        stdio: 'inherit',
    });
    await ChildProcess.spawn('npm', ['i'], {
        cwd: path.join(process.cwd(), 'cli'),
        env: process.env,
        stdio: 'inherit',
    });
    await ChildProcess.spawn('npm', ['i'], {
        cwd: path.join(process.cwd(), 'components', 'react'),
        env: process.env,
        stdio: 'inherit',
    });
    await setup();
}

exports.postinstall = postinstall;
