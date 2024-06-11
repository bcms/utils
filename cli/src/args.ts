export interface Args {
    apiOrigin?: string;
    loginOtp?: string;
    userId?: string;
    version?: string;
    pull?: string;
    language?: string;
    output?: string;
    instanceId?: string;
}

export interface ArgInfo {
    flags: string[];
    description?: string;
    values?: string[];
}

export const argsMap: {
    [key: string]: ArgInfo;
} = {
    apiOrigin: {
        flags: ['--api', '--api-origin', '--apiOrigin'],
        description:
            'Origin of the BCMS API, if not provided it will' +
            ' default to: https://app.thebcms.com',
    },
    loginOtp: {
        flags: ['--login-otp', '--lo'],
        description:
            'Provide an OTP for login. This will skip manual login' +
            ' from the browser. OTP and be obtained via BCMS API with signed' +
            ' in user. This flag must be used in conjunction with --user-id',
    },
    userId: {
        flags: ['--user-id', '--uid'],
        description: 'ID of a user',
    },
    version: {
        flags: ['--version', '--v'],
        description:
            'Used to print currently installed version of the BCMS CLI',
    },
    pull: {
        flags: ['--pull'],
        description: 'Flag used for pulling data from the BCMS',
        values: ['types', 'entries', 'media'],
    },
    language: {
        flags: ['--language', '--lng'],
    },
    output: {
        flags: ['--output', '--out'],
        description: 'Output directory',
    },
    instanceId: {
        flags: ['--instanceId', '--iid'],
        description: 'ID of an instance',
    },
};

export function getArgs(): Args {
    const argv = process.argv.slice(2);
    const args: {
        [name: string]: string | boolean;
    } = {};
    let lastKey = '';
    while (argv.length > 0) {
        const arg = argv.splice(0, 1)[0];
        if (arg.startsWith('--')) {
            lastKey = arg;
            args[lastKey] = true;
        } else {
            args[lastKey] = arg;
        }
    }
    const output: any = {};
    for (const key in argsMap) {
        for (let i = 0; i < argsMap[key].flags.length; i++) {
            const flag = argsMap[key].flags[i];
            if (args[flag]) {
                output[key] = args[flag];
            }
        }
    }
    return output;
}

// function formatArgName(name: string) {
//     let output = name || '';
//     if (output.startsWith('--')) {
//         output = output.replace('--', '');
//     } else if (output.startsWith('-')) {
//         output = output.replace('-', '');
//     }
//     const parts = output.split('-');
//     return (
//         parts[0].toLowerCase() +
//         parts
//             .slice(1)
//             .map(
//                 (e) =>
//                     e.substring(0, 1).toUpperCase() +
//                     e.substring(1).toLowerCase(),
//             )
//             .join('')
//     );
// }
