const { createFS } = require('./utils/fs');

async function setup() {
    const fs = createFS(process.cwd());
    const dirs = [];
    for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i];
        if (!(await fs.exist(dir))) {
            await fs.mkdir(dir);
        }
    }
    const files = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!(await fs.exist(file, true))) {
            await fs.save(file, '');
        }
    }
}

exports.setup = setup;
