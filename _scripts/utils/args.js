function getArgs() {
    /**
     * @type {{[key: string]: string}}
     */
    const args = {};
    let lastKey = '';
    for (let i = 2; i < process.argv.length; i++) {
        const value = process.argv[i];
        if (lastKey) {
            args[lastKey] = value;
            lastKey = '';
        } else if (value.startsWith('--')) {
            lastKey = value.replace('--', '');
            args[lastKey] = '';
        }
    }
    return args;
}

exports.getArgs = getArgs;
