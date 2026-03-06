# BCMS Client (`@thebcms/client`)

[![NPM Version](https://img.shields.io/npm/v/@thebcms/client.svg)](https://npmjs.org/package/@thebcms/client)

Client library for communicating with the BCMS backend REST API. Use it to fetch and manage content, media, templates, and more from your BCMS instance. TypeScript types are included.

**Requirements:** Node.js 18+, a [BCMS instance](https://app.thebcms.com), and an API key in format `id.secret.instanceId`.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Client Options](#client-options)
- [Handlers](#handlers)
- [client.send](#clientsend)
- [Image Handler](#image-handler-thebcmsclientimage)

## Installation

```bash
npm i @thebcms/client
```

## Quick Start

```ts
import { Client } from '@thebcms/client';

const client = new Client({ apiKey: process.env.BCMS_API_KEY });

// Get all entries for a template
const entries = await client.entry.getAll('my-template-name');
console.log(entries);
```

Set `BCMS_API_KEY` in your environment (e.g. `.env`) with your key in format `id.secret.instanceId`.

## Client Options

Options passed to the `Client` constructor:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | — | **Required.** API key in format `id.secret.instanceId`. Can also use `BCMS_API_KEY` env variable. |
| `cmsOrigin` | `string` | `https://app.thebcms.com` | URL of the BCMS instance. |
| `useMemCache` | `boolean` | `false` | Enable in-memory caching for API responses. |
| `debug` | `boolean` | `false` | Enable debug mode. |
| `enableSocket` | `boolean` | `false` | Enable WebSocket connection. |
| `injectSvg` | `boolean` | `false` | Inject SVG content into media objects. |

## Handlers

The client exposes handlers for each BCMS resource. All methods that fetch data accept an optional `skipCache` argument to bypass in-memory cache (when `useMemCache` is enabled).

---

## client.template

Handler for BCMS templates. Templates define the structure (schema) of your content — properties, groups, and how entries are organized.

### getAll

Get all templates.

```ts
const templates = await client.template.getAll();
// skip cache
const templates = await client.template.getAll(true);
```

### getById

Get template by ID.

```ts
const template = await client.template.getById('template-id');
```

### whereIsItUsed

Find where template is used (in other templates, entries, etc.).

```ts
const result = await client.template.whereIsItUsed('template-id');
```

### update

Update template schema. Affects all entries using this template.

```ts
const updated = await client.template.update('template-id', {
  name: 'new-name',
  label: 'New Label',
  desc: 'Description',
  props: [...],
});
```

### deleteById

Delete template. Deletes all entries using this template.

```ts
const deleted = await client.template.deleteById('template-id');
```

## client.entry

Handler for content entries. Entries are the actual content items created from templates. Use template name or ID to target a specific content type.

**Formats:** Use `getAll` / `getById` for parsed entries (developer-friendly). Use `*Lite` for lighter data when you only need meta/slugs. Use `*Raw` only when you need the internal BCMS format.

### getAll

Get all parsed entries for a template.

```ts
const entries = await client.entry.getAll('my-template-name');
const entries = await client.entry.getAll('my-template-name', true); // skip cache
```

### getAllLite

Get all entries in lite format (faster, less data).

```ts
const entries = await client.entry.getAllLite('my-template-name');
```

### getAllRaw

Get all entries in raw format (internal BCMS format).

```ts
const entries = await client.entry.getAllRaw('my-template-name');
```

### getAllByStatus

Get all parsed entries filtered by status (ID or label).

```ts
const entries = await client.entry.getAllByStatus('my-template-name', 'published');
```

### getAllRawByStatus

Get all raw entries filtered by status.

```ts
const entries = await client.entry.getAllRawByStatus('my-template-name', 'published');
```

### getById

Get parsed entry by ID.

```ts
const entry = await client.entry.getById('entry-id', 'my-template-name');
```

### getByIdLite

Get lite entry by ID.

```ts
const entry = await client.entry.getByIdLite('entry-id', 'my-template-name');
```

### getByIdRaw

Get raw entry by ID.

```ts
const entry = await client.entry.getByIdRaw('entry-id', 'my-template-name');
```

### getBySlug

Get entry by slug.

```ts
const entry = await client.entry.getBySlug('my-entry-slug', 'my-template-name');
```

### create

Create new entry.

```ts
const entry = await client.entry.create('my-template-name', {
  statuses: [{ lng: 'en', id: 'status-id' }],
  meta: [{ lng: 'en', data: { title: 'Hello', ... } }],
  content: [{ lng: 'en', nodes: [...] }],
});
```

### createRaw

Create entry with raw BCMS format.

```ts
const entry = await client.entry.createRaw('my-template-name', rawEntryData);
```

### update

Update existing entry.

```ts
const entry = await client.entry.update('my-template-name', 'entry-id', {
  lng: 'en',
  status: 'status-id',
  meta: { title: 'Updated title', ... },
  content: [...],
});
```

### updateRaw

Update entry with raw BCMS format.

```ts
const entry = await client.entry.updateRaw('my-template-name', 'entry-id', rawUpdateData);
```

### deleteById

Delete entry by ID.

```ts
const deleted = await client.entry.deleteById('entry-id', 'my-template-name');
```

## client.entryStatus

Handler for entry statuses. Statuses control the workflow state of entries (e.g. draft, published, archived) and can be used to filter entries.

### getAll

Get all entry statuses.

```ts
const statuses = await client.entryStatus.getAll();
```

### getById

Get entry status by ID.

```ts
const status = await client.entryStatus.getById('status-id');
```

## client.group

Handler for groups. Groups are reusable structures of properties (like a "block" or "component") that can be used in templates and entries via GROUP_POINTER properties.

### getAll

Get all groups.

```ts
const groups = await client.group.getAll();
```

### getById

Get group by ID.

```ts
const group = await client.group.getById('group-id');
```

### whereIsItUsed

Find where group is used.

```ts
const result = await client.group.whereIsItUsed('group-id');
```

## client.language

Handler for languages. BCMS supports multi-language content; languages define the locales available for entries and media.

### getAll

Get all languages.

```ts
const languages = await client.language.getAll();
```

### getById

Get language by ID.

```ts
const language = await client.language.getById('language-id');
```

## client.media

Handler for the media library. Manages files, images, and directories — upload, update metadata, fetch binaries, and resolve paths.

### getAll

Get all media files and directories.

```ts
const media = await client.media.getAll();
```

### getById

Get media by ID.

```ts
const media = await client.media.getById('media-id');
```

### resolvePath

Resolve full path for media (e.g. `/dir1/dir2/file.txt`).

```ts
const path = client.media.resolvePath(media, allMedia);
```

### requestUploadToken

Get upload token. Valid 15 minutes, single use only.

```ts
const token = await client.media.requestUploadToken();
```

### createDir

Create directory in media library.

```ts
const dir = await client.media.createDir({
  name: 'new-folder',
  parentId: 'parent-id', // optional
});
```

### createFile

Create media file. Requires upload token from `requestUploadToken()`.

```ts
const file = await client.media.createFile({
  parentId: 'parent-id',
  uploadToken: token,
  file: fileObject,
  name: 'image.png',
  onUploadProgress: (event) => console.log(event.loaded),
});
```

### update

Update media metadata.

```ts
const updated = await client.media.update({
  _id: 'media-id',
  name: 'new-name',
  altText: 'Alt text',
  caption: 'Caption',
});
```

### deleteById

Delete media files or directories.

```ts
await client.media.deleteById({ ids: ['media-id-1', 'media-id-2'] });
```

### getMediaBin

Get media binary data as ArrayBuffer.

```ts
const buffer = await client.media.getMediaBin('media-id', 'image.png');
const thumbnail = await client.media.getMediaBin('media-id', 'image.png', { thumbnail: true });
const webp = await client.media.getMediaBin('media-id', 'image.png', { webp: true });
```

### toUri

Get media URI for use in URLs.

```ts
const uri = client.media.toUri('media-id', 'image.png');
const thumbUri = client.media.toUri('media-id', 'image.png', { thumbnail: true });
```

## client.widget

Handler for widgets. Widgets are reusable rich-text or structured content components that can be embedded in entry content.

### getAll

Get all widgets.

```ts
const widgets = await client.widget.getAll();
```

### getById

Get widget by ID.

```ts
const widget = await client.widget.getById('widget-id');
```

### whereIsItUsed

Find where widget is used.

```ts
const result = await client.widget.whereIsItUsed('widget-id');
```

## client.typeGenerator

Handler for generating type definitions from your BCMS schema. Produces TypeScript, Rust, Go, or GraphQL type files for type-safe content access.

### getFiles

Get type definition files for code generation. Language: `ts`, `rust`, `golang`, or `gql`.

```ts
const files = await client.typeGenerator.getFiles('ts');
```

## client.socket

Handler for WebSocket connections. Subscribe to real-time events (e.g. entry created, updated) and emit events to the BCMS backend. Requires `enableSocket: true` in client options.

### connect

Connect to WebSocket server.

```ts
await client.socket.connect();
```

### disconnect

Disconnect from socket server.

```ts
client.socket.disconnect();
```

### clear

Close connection and clear all data.

```ts
client.socket.clear();
```

### register

Subscribe to BCMS socket events (e.g. `entry_created`, `entry_updated`).

```ts
const unsubscribe = client.socket.register('entry_created', async (data) => {
  console.log('Entry created:', data);
});
// later: unsubscribe();
```

### internalEventRegister

Subscribe to `open` or `close` connection events.

```ts
const unsubscribe = client.socket.internalEventRegister('open', async () => {
  console.log('Socket connected');
});
```

### emit

Emit event to BCMS backend.

```ts
client.socket.emit('event-name', eventData);
```

## client.send

Low-level method to send custom HTTP requests to the CMS backend. Accepts standard Axios request config when you need to call endpoints not covered by the handlers.

```ts
const data = await client.send({
  method: 'GET',
  url: '/api/custom-endpoint',
});
```

## Image Handler (`@thebcms/client/image`)

Utility for media of type IMG. Use it to build responsive image src sets or retrieve SVG content. Import separately from `@thebcms/client/image`.

### getPictureSrcSet

Returns a source set for responsive images. Throws if media is not IMG type.

```ts
import { ImageHandler } from '@thebcms/client/image';

const handler = new ImageHandler(client, media);
const srcSet = handler.getPictureSrcSet(800);
// { original, src1, src2, width, height }
```

### getSvgContent

Get SVG content for media file. Throws if media is not SVG.

```ts
const svgString = await handler.getSvgContent();
```

---

## Links

- [BCMS Dashboard](https://app.thebcms.com) — Manage templates, entries, API keys
- [BCMS Docs](https://thebcms.com/docs) — General BCMS documentation
- [BCMS API Documentation](https://app.thebcms.com/open-api-docs) — REST API reference
