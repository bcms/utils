export interface MemCacheQuery<ItemType> {
    (item: ItemType): boolean | number | string | unknown;
}

export interface MemCacheMethods<ItemType, Methods = unknown> {
    (cache: MemCache<ItemType>): Methods;
}

export class MemCache<ItemType, Methods = unknown> {
    public items: ItemType[] = [];
    public methods: Methods;

    constructor(
        private idKey: keyof ItemType,
        methods?: MemCacheMethods<ItemType, Methods>,
    ) {
        this.methods = methods ? methods(this) : (null as never);
    }

    find(query: MemCacheQuery<ItemType>): ItemType | null {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (query(item as ItemType)) {
                return item as ItemType;
            }
        }
        return null;
    }

    findById(id: string): ItemType | null {
        const output = this.items.find((e) => e[this.idKey] === id);
        return (output as ItemType) || null;
    }

    findMany(query: MemCacheQuery<ItemType>): ItemType[] {
        const output: ItemType[] = [];
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (query(item as ItemType)) {
                output.push(this.items[i] as ItemType);
            }
        }
        return output;
    }

    findManyById(ids: string[]): ItemType[] {
        return this.items.filter((e) => ids.includes(e[this.idKey] as string));
    }

    set(inputItems: ItemType | ItemType[]): void {
        const items = inputItems instanceof Array ? inputItems : [inputItems];
        for (let i = 0; i < items.length; i++) {
            const inputItem = items[i];
            let found = false;
            for (let j = 0; j < this.items.length; j++) {
                const storeItem = this.items[j];
                if (storeItem[this.idKey] === inputItem[this.idKey]) {
                    found = true;
                    this.items.splice(j, 1, inputItem);
                    break;
                }
            }
            if (!found) {
                this.items.push(inputItem as any);
            }
        }
    }

    remove(ids_: string | string[]): void {
        const ids = ids_ instanceof Array ? ids_ : [ids_];
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            for (let j = 0; j < this.items.length; j++) {
                const item = this.items[j];
                if (item[this.idKey] === id) {
                    this.items.splice(j, 1);
                }
            }
        }
    }

    async clear() {
        this.items = [];
    }
}
