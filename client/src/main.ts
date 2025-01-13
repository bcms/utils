import axios, { type AxiosRequestConfig } from 'axios';
import { TemplateHandler } from '@thebcms/client/handlers/template';
import { TypeGeneratorHandler } from '@thebcms/client/handlers/type-generator';
import { EntryHandler } from '@thebcms/client/handlers/entry';
import { EntryStatusHandler } from '@thebcms/client/handlers/entry-status';
import { GroupHandler } from '@thebcms/client/handlers/group';
import { LanguageHandler } from '@thebcms/client/handlers/language';
import { MediaHandler } from '@thebcms/client/handlers/media';
import { WidgetHandler } from '@thebcms/client/handlers/widget';
import { SocketHandler } from '@thebcms/client/handlers/socket';

export interface ClientApiKey {
    id: string;
    secret: string;
}

export interface ClientConfig {
    orgId: string;
    instanceId: string;
    apiKey: ClientApiKey;
    cmsOrigin: string;
    useMemCache: boolean;
    debug: boolean;
    enableSocket: boolean;
    injectSvg: boolean;
}

export class Client {
    cmsOrigin = 'https://app.thebcms.com';
    useMemCache = false;
    debug = false;
    enableSocket = false;
    injectSvg = false;

    template: TemplateHandler;
    typeGenerator: TypeGeneratorHandler;
    entry: EntryHandler;
    entryStatus: EntryStatusHandler;
    group: GroupHandler;
    language: LanguageHandler;
    media: MediaHandler;
    widget: WidgetHandler;
    socket: SocketHandler;

    constructor(
        public orgId: string,
        public instanceId: string,
        public apiKeyInfo: ClientApiKey,
        options?: {
            cmsOrigin?: string;
            useMemCache?: boolean;
            debug?: boolean;
            enableSocket?: boolean;
            injectSvg?: boolean;
        },
    ) {
        if (options) {
            if (options.cmsOrigin) {
                this.cmsOrigin = options.cmsOrigin;
            }
            if (options.useMemCache) {
                this.useMemCache = options.useMemCache;
            }
            if (options.debug) {
                this.debug = options.debug;
            }
            if (options.enableSocket) {
                this.enableSocket = options.enableSocket;
            }
            if (options.injectSvg) {
                this.injectSvg = options.injectSvg;
            }
        }
        this.socket = new SocketHandler(this);
        this.template = new TemplateHandler(this);
        this.typeGenerator = new TypeGeneratorHandler(this);
        this.entry = new EntryHandler(this);
        this.entryStatus = new EntryStatusHandler(this);
        this.group = new GroupHandler(this);
        this.language = new LanguageHandler(this);
        this.media = new MediaHandler(this);
        this.widget = new WidgetHandler(this);
    }

    getConfig(): ClientConfig {
        return {
            apiKey: this.apiKeyInfo,
            cmsOrigin: this.cmsOrigin,
            debug: this.debug,
            enableSocket: this.enableSocket,
            injectSvg: this.injectSvg,
            instanceId: this.instanceId,
            orgId: this.orgId,
            useMemCache: this.useMemCache,
        };
    }

    async send<Data = unknown>(config: AxiosRequestConfig): Promise<Data> {
        if (!config.headers) {
            config.headers = {};
        }
        config.headers.Authorization = `ApiKey ${this.apiKeyInfo.id}.${this.apiKeyInfo.secret}`;
        config.url =
            `${config.url && config.url.startsWith('http') ? '' : this.cmsOrigin}${config.url}`
                .replace(':instanceId', this.instanceId)
                .replace(':orgId', this.orgId);
        if (!config.timeout) {
            config.timeout = 60000;
        }
        const res = await axios(config);
        return res.data;
    }
}
