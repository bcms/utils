import { createServer, type Server as ServerNode } from 'http';
import { Html } from '@thebcms/cli/server/html';

export class Server {
    private server: ServerNode;
    private loginCallback:
        | ((data: { otp: string; userId: string }, err?: string) => void)
        | null = null;

    port = 0;
    html = new Html();

    constructor() {
        this.server = createServer((req, res) => {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString(); // convert Buffer to string
            });
            req.on('end', async () => {
                const url = req.url || '';
                if (url.startsWith('/login-callback')) {
                    if (!this.loginCallback) {
                        return res.end(
                            await this.html.get('login-error', {
                                error:
                                    'Cannot verify that terminal window' +
                                    ' is running. Please try again',
                            }),
                        );
                    }
                    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
                    const query = this.getQuery<{
                        otp?: string;
                        userId?: string;
                    }>(url);
                    if (!query.otp) {
                        this.loginCallback(
                            { otp: '', userId: '' },
                            'Missing OTP query',
                        );
                        return res.end(
                            await this.html.get('login-error', {
                                error: 'Missing OTP query',
                            }),
                        );
                    }
                    if (!query.userId) {
                        this.loginCallback(
                            { otp: '', userId: '' },
                            'Missing UserID query',
                        );
                        return res.end(
                            await this.html.get('login-error', {
                                error: 'Missing UserID query',
                            }),
                        );
                    }
                    this.loginCallback({
                        otp: query.otp,
                        userId: query.userId,
                    });
                    return res.end(
                        await this.html.get('login-success', {
                            message:
                                'You can now close this browser tab safely' +
                                ' and return to terminal window',
                        }),
                    );
                }
            });
        });
    }

    private getQuery<Query = unknown>(url: string): Query {
        const queryString = url.split('?')[1];
        if (!queryString) {
            return {} as Query;
        }
        const output: {
            [key: string]: string;
        } = {};
        const queryParts = queryString.split('&');
        for (let i = 0; i < queryParts.length; i++) {
            const [key, value] = queryParts[i].split('=');
            output[key] = decodeURIComponent(value);
        }
        return output as Query;
    }

    async start() {
        await new Promise<void>((resolve) => {
            this.server = this.server.listen(() => {
                const address = this.server.address();
                if (address && typeof address === 'object') {
                    this.port = address.port;
                }
                resolve();
            });
        });
    }

    async awaitForLoginCallback() {
        return await new Promise<{ otp: string; userId: string }>(
            (resolve, reject) => {
                this.loginCallback = (data, err) => {
                    if (err) {
                        this.loginCallback = null;
                        reject(err);
                    } else {
                        this.loginCallback = null;
                        resolve(data);
                    }
                };
            },
        );
    }

    async destroy() {
        await new Promise<void>((resolve, reject) => {
            this.server.close((err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }
}
