export interface Args {
    login?: boolean;
    logout?: boolean;
    create?: string | boolean;
    starter?: string;
    projectName?: string;
    pull?: string;
    language?: string;

    apiOrigin?: string;
    loginOtp?: string;
    userId?: string;
    version?: string;
    output?: string;
    instanceId?: string;
}

export interface ArgInfo {
    flags: string[];
    type: 'string' | 'boolean';
    description?: string;
    values?: string[];
    parse(argv: string[], atIndex: number, self: ArgInfo): string | boolean;
}

export const argsMap: {
    [key: string]: ArgInfo;
} = {
    login: {
        flags: ['--login', 'login'],
        description: 'Login to the BCMS via magic link',
        type: 'boolean',
        parse() {
            return true;
        },
    },
    logout: {
        flags: ['--logout', 'logout'],
        description: 'Logout from the BCMS and remove local information',
        type: 'boolean',
        parse() {
            return true;
        },
    },
    create: {
        flags: ['--create', 'create'],
        description: 'Create project of specified type',
        values: ['next', 'nuxt', 'gatsby'],
        type: 'string',
        parse(argv, idx, self) {
            const values = self.values as string[];
            if (values.includes(argv[idx + 1])) {
                return argv[idx + 1];
            }
            return true;
        },
    },
    starter: {
        flags: ['--starter', 'starter'],
        description: 'Create a project with specified starter',
        type: 'string',
        parse(argv, idx) {
            if (argv[idx + 1]) {
                return argv[idx + 1];
            }
            return false;
        },
    },
    projectName: {
        flags: ['--project-name', 'project-name'],
        description: 'Create a project with specified name',
        type: 'string',
        parse(argv, idx) {
            if (argv[idx + 1]) {
                return argv[idx + 1];
            }
            return false;
        },
    },
    pull: {
        flags: ['--pull', 'pull'],
        description: 'Flag used for pulling data from the BCMS',
        values: ['types', 'entries', 'entries-all', 'media'],
        type: 'string',
        parse(argv, idx, self) {
            const values = self.values as string[];
            const a = argv[idx + 1];
            const b = argv[idx + 2];
            if (a === 'entries' && b === 'all') {
                return 'entries-all';
            }
            if (values.includes(a)) {
                return a;
            }
            return false;
        },
    },
    language: {
        flags: ['--language', '--lng', 'language', 'lng'],
        type: 'string',
        parse(argv, idx) {
            if (argv[idx + 1]) {
                return argv[idx + 1];
            }
            return false;
        },
    },

    apiOrigin: {
        flags: [
            '--api',
            '--api-origin',
            '--apiOrigin',
            'api',
            'api-origin',
            'apiOrigin',
        ],
        description:
            'Origin of the BCMS API, if not provided it will' +
            ' default to: https://app.thebcms.com',
        type: 'string',
        parse(argv, idx) {
            if (argv[idx + 1]) {
                return argv[idx + 1];
            }
            return false;
        },
    },
    loginOtp: {
        flags: ['--login-otp', '--lo', 'login-otp', 'lo'],
        description:
            'Provide an OTP for login. This will skip manual login' +
            ' from the browser. OTP and be obtained via BCMS API with signed' +
            ' in user. This flag must be used in conjunction with --user-id',
        type: 'string',
        parse(argv, idx) {
            if (argv[idx + 1]) {
                return argv[idx + 1];
            }
            return false;
        },
    },
    userId: {
        flags: ['--user-id', '--uid', 'user-id', 'uid'],
        description: 'ID of a user',
        type: 'string',
        parse(argv, idx) {
            if (argv[idx + 1]) {
                return argv[idx + 1];
            }
            return false;
        },
    },
    version: {
        flags: ['--version', '--v', 'version', 'v'],
        description:
            'Used to print currently installed version of the BCMS CLI',
        type: 'string',
        parse(argv, idx) {
            if (argv[idx + 1]) {
                return argv[idx + 1];
            }
            return false;
        },
    },
    output: {
        flags: ['--output', '--out', 'output', 'out'],
        description: 'Output directory',
        type: 'string',
        parse(argv, idx) {
            if (argv[idx + 1]) {
                return argv[idx + 1];
            }
            return false;
        },
    },
    instanceId: {
        flags: ['--instance-id', '--iid', 'instance-id', 'iid'],
        description: 'ID of an instance',
        type: 'string',
        parse(argv, idx) {
            if (argv[idx + 1]) {
                return argv[idx + 1];
            }
            return false;
        },
    },
};

export function getArgs(): Args {
    const argv = process.argv;
    const args: {
        [name: string]: string | boolean;
    } = {};
    for (const key in argsMap) {
        for (let i = 0; i < argv.length; i++) {
            const argValue = argv[i];
            if (!argsMap[key].flags.includes(argValue)) {
                continue;
            }
            const value = argsMap[key].parse(argv, i, argsMap[key]);
            if (value) {
                args[key] = value;
            }
        }
    }
    return args;
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
