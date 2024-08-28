const { postinstall } = require('./postinstall');
const { setup } = require('./setup');
const { preCommit } = require('./pre-commit');
const { bundlePackage } = require('./bundle');
const { packPackage } = require('./pack');

async function main() {
    const command = process.argv[2];
    if (command === 'postinstall') {
        await postinstall();
    } else if (command === 'setup') {
        await setup();
    } else if (command === 'pre-commit') {
        await preCommit();
    } else if (command === 'bundle-package') {
        await bundlePackage();
    } else if (command === 'pack-package') {
        await packPackage();
    } else {
        throw Error(`Unknown command: ${command}`);
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
