const { postinstall } = require('./postinstall');
const { setup } = require('./setup');
const { preCommit } = require('./pre-commit');
const { buildCli } = require('./cli');
const { createPackage } = require('./utils/package');
const { publish } = require('./utils/publish');
const { buildClient } = require('./client');
const { buildComponentsReact } = require('./components-react');
const { buildComponentsVue } = require('./components-vue');

async function main() {
    const command = process.argv[2];
    switch (command) {
        case 'postinstall': {
            return postinstall();
        }
        case 'setup': {
            return await setup();
        }
        case 'pre-commit': {
            return await preCommit();
        }

        case 'build-cli': {
            return await buildCli();
        }
        case 'package-cli': {
            return await createPackage(['cli', 'dist']);
        }
        case 'publish-cli': {
            return await publish(['cli', 'dist']);
        }

        case 'build-client': {
            return await buildClient();
        }
        case 'package-client': {
            return await createPackage(['client', 'dist']);
        }
        case 'publish-client': {
            return await publish(['client', 'dist']);
        }

        case 'build-components-react': {
            return await buildComponentsReact();
        }
        case 'package-components-react': {
            return await createPackage(['components', 'react', 'dist']);
        }
        case 'publish-components-react': {
            return await publish(['components', 'react', 'dist']);
        }

        case 'build-components-vue': {
            return await buildComponentsVue();
        }
        case 'package-components-vue': {
            return await createPackage(['components', 'vue', 'dist']);
        }
        case 'publish-components-vue': {
            return await publish(['components', 'vue', 'dist']);
        }
    }
    throw Error(`Unknown command: ${command}`);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
