const { ChildProcess } = require('./utils/child-process');
const path = require('path');

async function preCommit() {
    const whatToCheck = {
        client: false,
        cli: false,
        componentsReact: false,
    };
    let gitOutput = '';
    await ChildProcess.advancedExec('git status', {
        cwd: process.cwd(),
        doNotThrowError: true,
        onChunk(type, chunk) {
            gitOutput += chunk;
            process[type].write(chunk);
        },
    }).awaiter;
    const paths = StringUtility.allTextBetween(gitOutput, '   ', '\n');
    for (let i = 0; i < paths.length; i++) {
        const p = paths[i];
        if (p.startsWith('client/')) {
            whatToCheck.client = true;
        } else if (p.startsWith('cli/')) {
            whatToCheck.cli = true;
        } else if (p.startsWith('components/react')) {
            whatToCheck.componentsReact = true;
        }
    }
    if (whatToCheck.client) {
        await ChildProcess.spawn('npm', ['run', 'lint'], {
            cwd: path.join(process.cwd(), 'client'),
            stdio: 'inherit',
        });
        await ChildProcess.spawn('npm', ['run', 'build:noEmit'], {
            cwd: path.join(process.cwd(), 'client'),
            stdio: 'inherit',
        });
    }
    if (whatToCheck.cli) {
        await ChildProcess.spawn('npm', ['run', 'lint'], {
            cwd: path.join(process.cwd(), 'cli'),
            stdio: 'inherit',
        });
        await ChildProcess.spawn('npm', ['run', 'build:noEmit'], {
            cwd: path.join(process.cwd(), 'cli'),
            stdio: 'inherit',
        });
    }
    if (whatToCheck.componentsReact) {
        await ChildProcess.spawn('npm', ['run', 'lint'], {
            cwd: path.join(process.cwd(), 'components', 'react'),
            stdio: 'inherit',
        });
        await ChildProcess.spawn('npm', ['run', 'build:noEmit'], {
            cwd: path.join(process.cwd(), 'components', 'react'),
            stdio: 'inherit',
        });
    }
}

exports.preCommit = preCommit;
