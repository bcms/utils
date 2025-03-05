# Becomes CMS client library

[![NPM Version][npm-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/@thebcms/client.svg
[npm-url]: https://npmjs.org/package/@thebcms/client

This library provides easy access to BCMS backend REST API.

## Getting started

1. Install package from NPM: `npm i --save @thebcms/client`
2. Create a new Client instance and make a request to the BCMS:

```ts
import { Client } from '@thebcms/client/main';

async function main() {
    /**
     * Creating a new instance of the Client object
     */
    const client = new Client(
        'ORG_ID',
        'PROJECT_ID',
        {
            id: 'KEY_ID',
            secret: 'KEY_SECRET',
        },
        {
            injectSvg: true,
        },
    );
    /**
     * Get all entries for template
     */
    const entries = await client.entry.getAll('my-template-name');
    console.log(entries);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

## Getting Entries

To get all Entries from BCMS for specified Template you can use:

```ts
const entries = await client.entries.getAll('my-template-name-or-id');
```

Common question that we are get is for to query entries. Currently, we do not have native support for querying Entries, therefore you will need to filter Entries on client side, for example something like this:

```ts
const entries = (await client.entries.getAll('my-template-name-or-id')).filter(
    (entry) => entry.meta.en.my_prop === 'some-value',
);
```
