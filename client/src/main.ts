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
import { AIHandler } from '@thebcms/client/handlers/ai';

export interface ClientApiKey {
    id: string;
    secret: string;
}

export interface ClientConfig {
    /**
     * Instance/Project ID
     */
    instanceId: string;
    /**
     * API Key information
     */
    apiKey: ClientApiKey;
    /**
     * URL of the active CMS
     */
    cmsOrigin: string;
    /**
     * Is memory caching active
     */
    useMemCache: boolean;
    /**
     * Is in debug mode
     */
    debug: boolean;
    /**
     * Is web socket enabled
     */
    enableSocket: boolean;
    /**
     * Should SVG data be injected info media object
     */
    injectSvg: boolean;
}

export class Client {
    /**
     * URL of the active CMS
     */
    cmsOrigin = 'https://app.thebcms.com';
    /**
     * Is memory caching active
     */
    useMemCache = false;
    /**
     * Is in debug mode
     */
    debug = false;
    /**
     * Is web socket enabled
     */
    enableSocket = false;
    /**
     * Should SVG data be injected info media object
     */
    injectSvg = false;

    template: TemplateHandler;
    typeGenerator: TypeGeneratorHandler;
    entry: EntryHandler;
    entryStatus: EntryStatusHandler;
    group: GroupHandler;
    language: LanguageHandler;
    media: MediaHandler;
    widget: WidgetHandler;
    ai: AIHandler;
    socket: SocketHandler;

    constructor(
        /**
         * Instance/Project ID
         */
        public instanceId: string,
        /**
         * API Key information
         */
        public apiKeyInfo: ClientApiKey,
        options?: {
            /**
             * URL of the active CMS
             */
            cmsOrigin?: string;
            /**
             * Is memory caching active
             */
            useMemCache?: boolean;
            /**
             * Is in debug mode
             */
            debug?: boolean;
            /**
             * Is web socket enabled
             */
            enableSocket?: boolean;
            /**
             * Should SVG data be injected info media object
             */
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
        this.ai = new AIHandler(this);
    }

    /**
     * Get configuration of the current Client
     */
    getConfig(): ClientConfig {
        return {
            apiKey: this.apiKeyInfo,
            cmsOrigin: this.cmsOrigin,
            debug: this.debug,
            enableSocket: this.enableSocket,
            injectSvg: this.injectSvg,
            instanceId: this.instanceId,
            useMemCache: this.useMemCache,
        };
    }

    /**
     * Send request to the CMS backend
     */
    async send<Data = unknown>(config: AxiosRequestConfig): Promise<Data> {
        if (!config.headers) {
            config.headers = {};
        }
        config.headers.Authorization = `ApiKey ${this.apiKeyInfo.id}.${this.apiKeyInfo.secret}`;
        config.url =
            `${config.url && config.url.startsWith('http') ? '' : this.cmsOrigin}${config.url}`.replace(
                ':instanceId',
                this.instanceId,
            );
        if (!config.timeout) {
            config.timeout = 60000;
        }
        const res = await axios(config);
        return res.data;
    }
}
