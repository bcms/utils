# BCMS Svelte Components (`@thebcms/components-svelte`)

[![NPM Version](https://img.shields.io/npm/v/@thebcms/components-svelte.svg)](https://npmjs.org/package/@thebcms/components-svelte)

Helper components for rendering BCMS content in Svelte 5 — images with responsive src sets and rich content (widgets, media).

**For full setup, integration steps, and best practices, see the official documentation:**

**[BCMS SvelteKit Documentation →](https://thebcms.com/docs/integrations/svelte)**

---

## Installation

**Requirements:** Svelte 5+, `@thebcms/client` ^2.0.1, `@thebcms/types` ^2

```bash
npm i @thebcms/components-svelte @thebcms/client @thebcms/types
```

---

## Components Overview

| Component          | Import path                              | Purpose                                      |
|-------------------|------------------------------------------|----------------------------------------------|
| BCMSImage        | `@thebcms/components-svelte`             | Render BCMS media (IMG, SVG, GIF) with optimization |
| BCMSContentManager | `@thebcms/components-svelte`           | Render entry content (rich text, widgets, media) |

---

## BCMSImage

Renders BCMS media as optimized images. Supports IMG, SVG, and GIF. Produces responsive `<picture>` with WebP and updates src set on resize. Injects SVG when `injectSvg` is enabled in client config.

### Props

| Prop           | Type                            | Required | Description                                      |
|----------------|---------------------------------|----------|--------------------------------------------------|
| `media`        | `Media \| MediaExtended \| PropMediaDataParsed` | Yes | BCMS media object to display                    |
| `clientConfig` | `ClientConfig`                  | Yes      | BCMS client config (`getConfig()` from `Client`) |
| `altText`      | `string`                        | No       | Alt text (falls back to `media.altText` or `media.name`) |
| `id`           | `string`                        | No       | Element ID                                      |
| `class`        | `string`                        | No       | CSS class                                       |
| `style`        | `string`                        | No       | Inline style                                    |

### Example

```svelte
<script>
  import { BCMSImage } from '@thebcms/components-svelte';
  import { bcmsClient } from '$lib/bcms-client';

  let { media } = $props();
</script>

<BCMSImage
  {media}
  clientConfig={bcmsClient.getConfig()}
  altText="Cover image"
  class="rounded-lg"
/>
```

---

## BCMSContentManager

Renders BCMS entry content (rich-text nodes). Handles widgets, media embeds, and primitives. Pass widget components to customize widget rendering.

### Props

| Prop               | Type                         | Required | Description                                      |
|--------------------|------------------------------|----------|--------------------------------------------------|
| `items`            | `EntryContentParsedItem[]`   | Yes      | Content nodes (e.g. `entry.content.en`)         |
| `widgetComponents` | `BCMSWidgetComponents`       | No       | Map of widget name → Svelte component           |
| `nodeParser`       | `(item) => any`              | No       | Custom renderer for nodes                       |
| `clientConfig`     | `ClientConfig`               | No       | Required for media nodes (images)                |
| `id`               | `string`                     | No       | Element ID                                      |
| `class`            | `string`                     | No       | CSS class                                       |
| `style`            | `string`                     | No       | Inline style                                    |

### BCMSWidgetComponents

Object mapping widget names to Svelte components:

```ts
import type { BCMSWidgetComponents } from '@thebcms/components-svelte';
import HeroWidget from './HeroWidget.svelte';

const widgetComponents: BCMSWidgetComponents = {
  hero: HeroWidget,
};
```

### Example

```svelte
<script>
  import { BCMSContentManager } from '@thebcms/components-svelte';
  import { bcmsClient } from '$lib/bcms-client';
  import HeroWidget from './HeroWidget.svelte';

  let { items } = $props();

  const widgetComponents = {
    hero: HeroWidget,
  };
</script>

<BCMSContentManager
  {items}
  {widgetComponents}
  clientConfig={bcmsClient.getConfig()}
  class="prose max-w-none"
/>
```

---

## Links

- [BCMS SvelteKit Documentation](https://thebcms.com/docs/integrations/svelte) — Setup, integration, examples
- [BCMS Dashboard](https://app.thebcms.com) — Manage content and API keys
- [@thebcms/client](./BCMS-CLIENT.md) — API reference for fetching content
