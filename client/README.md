# Becomes CMS client library

[![NPM Version][npm-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/@thebcms/client.svg
[npm-url]: https://npmjs.org/package/@thebcms/client

This library provides an easy access to [BCMS API](https://github.com/becomesco/cms).

## Getting started

1. Install package from NPM: `npm i --save @thebcms/client`
2. Create a new Client instance and make a request to the BCMS:

```ts
import { createBcmsClient } from '@becomes/cms-client';

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
