import path from 'path';
import { fileURLToPath } from 'node:url';
import { FS } from '@thebcms/utils/fs';

const thisDir = path.dirname(fileURLToPath(import.meta.url));

export class Html {
    private fs = new FS(path.join(thisDir, 'html'));

    async get<Vars = any>(name: string, variables?: Vars): Promise<string> {
        let html = await this.fs.readString(name + '.html');
        if (variables) {
            for (const key in variables) {
                const value = variables[key] + '';
                html = html.replace(new RegExp('@' + key, 'g'), value);
            }
        }
        return html;
    }
}
