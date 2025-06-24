import type { Client } from '@thebcms/client';

export class AIHandler {
    private baseUri = `/api/v3/org/:orgId/instance/:instanceId/ai`;

    constructor(private client: Client) {}

    async prompt(data: { prompt: string; data?: any }) {
        if (!this.client.socket.socket) {
            this.client.enableSocket = true;
            await this.client.socket.connect();
        }
        const res = await this.client.send({
            url: `${this.baseUri}/prompt`,
            method: 'POST',
            data: {
                prompt: data.prompt,
                data: data.data,
            },
        });
        return res;
    }
}
