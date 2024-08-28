const { spawn, exec } = require('child_process');

/**
 * @typedef {{
 *  stop(): void;
 *  awaiter: Promise<void>;
 * }} ChildProcessExecOutput
 *
 * @typedef {'stdout' | 'stderr'} ChildProcessExecChunkType
 *
 * @typedef {{
 *  out: string;
 *  err: string;
 * }} ChildProcessOnChunkHelperOutput
 *
 * @typedef {
 *  (type: ChildProcessExecChunkType, chunk: string) => void
 * } ChildProcessOnChunk
 *
 * @typedef {{
 *     spawn(
 *         cmd: string,
 *         args: string[],
 *         options: SpawnOptions,
 *     ): Promise<void>;
 *     advancedExec(
 *          cmd: string | string[],
 *          options?: ExecOptions & {
 *              onChunk?: ChildProcessOnChunk;
 *              doNotThrowError?: boolean;
 *          }
 *     ): ChildProcessExecOutput
 * }} ChildProcess
 */

/**
 * @type ChildProcess
 */
exports.ChildProcess = {
    async spawn(cmd, args, options) {
        return await new Promise((resolve, reject) => {
            const proc = spawn(
                cmd,
                args,
                options
                    ? options
                    : {
                          stdio: 'inherit',
                      },
            );
            proc.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(
                        Error(
                            `Failed to spawn "${cmd} ${args.join(
                                ' ',
                            )}" with status code ${code}`,
                        ),
                    );
                    reject('Child process failed with code ' + code);
                }
            });
        });
    },

    async advancedExec(cmd, options) {
        /**
         * @type {ChildProcessExecOutput}
         */
        const output = {
            stop: undefined,
            awaiter: undefined,
        };
        output.awaiter = new Promise((resolve, reject) => {
            const proc = exec(
                cmd instanceof Array ? cmd.join(' ') : cmd,
                options,
            );
            output.stop = () => {
                const result = proc.kill();
                if (result) {
                    resolve();
                } else {
                    reject(Error('Failed to kill process'));
                }
            };
            if (options && options.onChunk) {
                const onChunk = options.onChunk;
                if (proc.stderr) {
                    proc.stderr.on('data', (chunk) => {
                        onChunk('stderr', chunk);
                    });
                }
                if (proc.stdout) {
                    proc.stdout.on('data', (chunk) => {
                        onChunk('stdout', chunk);
                    });
                }
            }
            proc.on('close', (code) => {
                if (options && options.doNotThrowError) {
                    resolve();
                } else if (code !== 0) {
                    reject(
                        Error(
                            `Failed to execute "${cmd}" with status code ${code}`,
                        ),
                    );
                } else {
                    resolve();
                }
            });
        });
        return output;
    },
};
