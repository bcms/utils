# BCMS Vue Components (`@thebcms/components-vue`)

[![NPM Version](https://img.shields.io/npm/v/@thebcms/components-vue.svg)](https://npmjs.org/package/@thebcms/components-vue)

Helper components for rendering BCMS content in Vue 3 — images with responsive src sets and rich content (widgets, media, primitives).

**For full setup, integration steps, and best practices, see the official documentation:**

**[BCMS Nuxt.js Documentation →](https://thebcms.com/docs/integrations/nuxt-js)** · [BCMS Vite + Vue →](https://thebcms.com/docs/integrations/vite)

---

## Installation

**Requirements:** Vue 3, `@thebcms/client` ^2.0.1, `@thebcms/types` 2.x

```bash
npm i @thebcms/components-vue @thebcms/client @thebcms/types
```

---

## Components Overview

| Component          | Import path                        | Purpose                                      |
|-------------------|------------------------------------|----------------------------------------------|
| BCMSImage         | `@thebcms/components-vue/image`    | Render BCMS media (IMG, SVG) with optimization |
| BCMSContentManager| `@thebcms/components-vue/content` | Render entry content (rich text, widgets, media) |

---

## BCMSImage

Renders BCMS media as optimized images. Supports IMG and SVG. Produces responsive `<picture>` with WebP and updates src set on resize.

### Props

| Prop          | Type                            | Required | Description                                      |
|---------------|---------------------------------|----------|--------------------------------------------------|
| `media`       | `Media \| MediaExtended \| PropMediaDataParsed` | Yes | BCMS media object to display                    |
| `client`      | `Client \| ClientConfig`        | Yes      | BCMS client instance or config                   |
| `altText`     | `string`                        | No       | Alt text (falls back to `media.altText` or `media.name`) |
| `useOriginal` | `boolean`                       | No       | Use original image instead of responsive src set (default: `false`) |
| `sizeTransform`| `string[]`                     | No       | Limit to specific size transforms                |
| `id`          | `string`                        | No       | Element ID                                      |
| `class`       | `string`                        | No       | CSS class                                       |
| `style`       | `string`                        | No       | Inline style                                    |

### Example

```vue
<script setup>
import { BCMSImage } from '@thebcms/components-vue';
import { bcmsClient } from '../bcms-client';

defineProps({
  media: { type: Object, required: true },
});
</script>

<template>
  <BCMSImage
    :media="media"
    :client="bcmsClient"
    alt-text="Cover image"
    class="rounded-lg"
  />
</template>
```

---

## BCMSContentManager

Renders BCMS entry content (rich-text nodes). Handles widgets, media embeds, and primitives. Pass widget components to customize widget rendering.

### Props

| Prop               | Type                         | Required | Description                                      |
|--------------------|------------------------------|----------|--------------------------------------------------|
| `items`            | `EntryContentParsedItem[]`   | Yes      | Content nodes from entry (e.g. `entry.content.en`) |
| `widgetComponents` | `BCMSWidgetComponents`       | No       | Map of widget name → Vue component               |
| `nodeParser`       | `(item) => string \| VNode`  | No       | Custom renderer for nodes (e.g. non-IMG media)    |
| `client`           | `Client \| ClientConfig`     | No       | Required for media nodes (images)                 |
| `id`               | `string`                     | No       | Element ID                                      |
| `class`            | `string`                     | No       | CSS class                                       |
| `style`            | `string \| object`           | No       | Inline style                                    |

### BCMSWidgetComponents

Object mapping widget names to Vue components:

```ts
import type { BCMSWidgetComponents } from '@thebcms/components-vue/content';
import HeroWidget from './HeroWidget.vue';

const widgetComponents: BCMSWidgetComponents = {
  hero: HeroWidget,
};
```

### Example

```vue
<script setup>
import { BCMSContentManager } from '@thebcms/components-vue';
import { bcmsClient } from '../bcms-client';
import type { BCMSWidgetComponents } from '@thebcms/components-vue/content';
import HeroWidget from './HeroWidget.vue';

const widgetComponents: BCMSWidgetComponents = {
  hero: HeroWidget,
};

defineProps({
  items: { type: Array, required: true },
});
</script>

<template>
  <BCMSContentManager
    :items="items"
    :widget-components="widgetComponents"
    :client="bcmsClient"
    class="prose max-w-none"
  />
</template>
```

---

## Links

- [BCMS Nuxt.js Documentation](https://thebcms.com/docs/integrations/nuxt-js) — Setup, integration, examples
- [BCMS Vite Documentation](https://thebcms.com/docs/integrations/vite) — Vue + Vite setup
- [BCMS Dashboard](https://app.thebcms.com) — Manage content and API keys
- [@thebcms/client](./BCMS-CLIENT.md) — API reference for fetching content
