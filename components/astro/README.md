# BCMS Astro Components (`@thebcms/components-astro`)

[![NPM Version](https://img.shields.io/npm/v/@thebcms/components-astro.svg)](https://npmjs.org/package/@thebcms/components-astro)

Helper components for rendering BCMS content in Astro — images with responsive src sets, rich text, and widgets.

**For full setup, integration steps, and best practices, see the official documentation:**

**[BCMS Astro Documentation →](https://thebcms.com/docs/integrations/astro)**

---

## Installation

**Requirements:** Astro 5+, `@thebcms/client` ^2.0.1, `@thebcms/types` ^2

```bash
npm i @thebcms/components-astro @thebcms/client @thebcms/types
```

---

## Components Overview

| Component      | Import path                       | Purpose                                      |
|---------------|-----------------------------------|----------------------------------------------|
| BCMSImage     | `@thebcms/components-astro/image` | Render BCMS media (IMG, SVG, GIF) with optimization |
| BCMSContent   | `@thebcms/components-astro/content` | Render entry content (rich text, widgets, media)     |

---

## BCMSImage

Renders BCMS media as optimized images. Supports IMG, SVG, and GIF. Produces responsive `<picture>` with WebP fallback and injects SVG when `injectSvg` is enabled in client config.

### Props

| Prop           | Type                            | Required | Description                                      |
|----------------|---------------------------------|----------|--------------------------------------------------|
| `media`        | `Media \| MediaExtended \| PropMediaDataParsed` | Yes | BCMS media object to display                    |
| `clientConfig` | `ClientConfig`                  | Yes      | BCMS client config (`getConfig()` from `Client`) |
| `altText`      | `string`                        | No       | Alt text (falls back to `media.altText` or `media.name`) |
| `useOriginal`  | `boolean`                       | No       | Use original image instead of src set           |
| `sizeTransform`| `string[]`                      | No       | Limit to specific size transforms               |
| `id`           | `string`                        | No       | Element ID                                      |
| `class`        | `string`                        | No       | CSS class                                       |
| `style`        | `string`                        | No       | Inline style                                    |

### Example

```astro
---
import BCMSImage from '@thebcms/components-astro/image';
import { bcmsClient } from '../bcms-client';

const media = entry.meta.en.cover_image; // from BCMS entry
const config = bcmsClient.getConfig();
---

<BCMSImage
  media={media}
  clientConfig={config}
  altText={entry.meta.en.title}
  class="rounded-lg"
/>
```

---

## BCMSContent

Renders BCMS entry content (rich-text nodes). Handles widgets, media embeds, and primitives. Pass widget components to customize how widgets render.

### Props

| Prop               | Type                         | Required | Description                                      |
|--------------------|------------------------------|----------|--------------------------------------------------|
| `items`            | `EntryContentParsedItem[]`   | Yes      | Content nodes from entry content (e.g. `entry.content.en`) |
| `widgetComponents` | `BCMSWidgetComponents`       | No       | Map of widget name → Astro component             |
| `nodeParser`       | `(item) => string`           | No       | Custom renderer for nodes (e.g. non-IMG media)   |
| `clientConfig`     | `ClientConfig`               | No       | Required for media nodes (images)                |
| `id`               | `string`                     | No       | Element ID                                      |
| `class`            | `string`                     | No       | CSS class                                       |
| `style`            | `string`                     | No       | Inline style                                    |

### BCMSWidgetComponents

Object mapping widget names to components:

```ts
import type { BCMSWidgetComponents } from '@thebcms/components-astro/content';
import MyWidget from './MyWidget.astro';

const widgetComponents: BCMSWidgetComponents = {
  'my-widget': MyWidget,
};
```

### Example

```astro
---
import BCMSContent from '@thebcms/components-astro/content';
import { bcmsClient } from '../bcms-client';
import type { BCMSWidgetComponents } from '@thebcms/components-astro/content';
import HeroWidget from '../components/HeroWidget.astro';

const widgetComponents: BCMSWidgetComponents = {
  hero: HeroWidget,
};

const config = bcmsClient.getConfig();
---

<BCMSContent
  items={entry.content.en}
  widgetComponents={widgetComponents}
  clientConfig={config}
  class="prose max-w-none"
/>
```

---

## bcms-image (Custom Element)

The Image component uses a `<bcms-image>` custom element for images that need responsive src sets. It updates the `srcset` when the viewport resizes. The custom element is registered when `image.ts` is loaded — include it in your layout or entry point if you use the responsive image output.

```ts
// e.g. in layouts/Layout.astro or a client script
import '@thebcms/components-astro/image';
```

---

## Links

- [BCMS Astro Documentation](https://thebcms.com/docs/integrations/astro) — Setup, integration, examples
- [BCMS Dashboard](https://app.thebcms.com) — Manage content and API keys
- [@thebcms/client](./BCMS-CLIENT.md) — API reference for fetching content
