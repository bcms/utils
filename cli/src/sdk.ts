import { v4 as uuidv4 } from 'uuid';
import { homedir } from 'os';
import path from 'path';
import {
    type AdditionalFile,
    type ApiKey,
    createSdk,
    type Dependency,
    type Entry,
    type EntryLite,
    type EntryStatus,
    type Event,
    type Fn,
    type Group,
    type Instance,
    type InstanceEnv,
    type InvitationProtected,
    type Job,
    type Language,
    type Media,
    type Org,
    type Sdk,
    type SdkStore,
    type Storage,
    type StorageSubscriptionHandler,
    type Tag,
    type Template,
    type UserProtected,
    type UserPublic,
    type Widget,
} from '@thebcms/sdk';
import { createArrayStore, FS } from '@thebcms/cli/util';

let me: UserProtected | null = null;

const sdkStore: SdkStore = {
    user: createArrayStore<
        UserProtected | UserPublic,
        {
            me(): UserProtected | null;
        }
    >('_id', [], (store) => {
        return {
            me() {
                if (sdk.accessToken) {
                    me = store.findById(
                        sdk.accessToken.payload.userId,
                    ) as UserProtected;
                }
                return me;
            },
        };
    }),
    org: createArrayStore<Org>('_id', []),
    instance: createArrayStore<Instance>('_id', []),
    group: createArrayStore<Group>('_id', []),
    template: createArrayStore<Template>('_id', []),
    tag: createArrayStore<Tag>('_id', []),
    media: createArrayStore<Media>('_id', []),
    widget: createArrayStore<Widget>('_id', []),
    apiKey: createArrayStore<ApiKey>('_id', []),
    language: createArrayStore<Language>('_id', []),
    invitation: createArrayStore<InvitationProtected>('_id', []),
    entry: createArrayStore<Entry>('_id', []),
    entryLite: createArrayStore<EntryLite>('_id', []),
    entryStatus: createArrayStore<EntryStatus>('_id', []),
    additionalFile: createArrayStore<AdditionalFile>('_id', []),
    fn: createArrayStore<Fn>('_id', []),
    event: createArrayStore<Event>('_id', []),
    job: createArrayStore<Job>('_id', []),
    dependency: createArrayStore<Dependency>('_id', []),
    instanceEnv: createArrayStore<InstanceEnv>('_id', []),
};

async function createStorage(): Promise<Storage> {
    const fs = new FS(path.join(homedir(), '.bcms', 'storage.json'));
    let _storage: {
        [key: string]: unknown;
    } = {};
    if (await fs.exist('', true)) {
        _storage = JSON.parse(await fs.readString(''));
    }
    const subs: {
        [id: string]: {
            key: string;
            handler: StorageSubscriptionHandler<unknown>;
        };
    } = {};

    return {
        async clear() {
            _storage = {};
            await fs.save('', JSON.stringify(_storage, null, 4));
            for (const id in subs) {
                await subs[id].handler(null, 'remove');
            }
        },
        async set(key, value) {
            _storage[key] = value;
            await fs.save('', JSON.stringify(_storage, null, 4));
            for (const id in subs) {
                if (subs[id].key === key) {
                    await subs[id].handler(value, 'set');
                }
            }
            return true;
        },
        async remove(key) {
            if (!_storage[key]) {
                return;
            }
            delete _storage[key];
            await fs.save('', JSON.stringify(_storage, null, 4));
            for (const id in subs) {
                if (subs[id].key === key) {
                    await subs[id].handler(null, 'remove');
                }
            }
        },
        get<Value = unknown>(key: string) {
            return (_storage[key] as Value) || null;
        },
        subscribe(key, handler) {
            const id = uuidv4();
            subs[id] = { key, handler: handler as never };
            return () => {
                delete subs[id];
            };
        },
    };
}

let sdk: Sdk = null as never;

export async function sdkCreate(apiOrigin: string) {
    sdk = createSdk(sdkStore, await createStorage(), {
        apiOrigin,
        metadata() {
            return {};
        },
    });
    return sdk;
}
