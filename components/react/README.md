# BCMS React Components (`@thebcms/components-react`)

[![NPM Version](https://img.shields.io/npm/v/@thebcms/components-react.svg)](https://npmjs.org/package/@thebcms/components-react)

Helper components for rendering BCMS content in React — images, video, audio, rich text, and widgets.

**For full setup, integration steps, and best practices, see the official documentation:**

**[BCMS Next.js Documentation →](https://thebcms.com/docs/integrations/next-js)** · [BCMS Vite + React →](https://thebcms.com/docs/integrations/vite)

---

## Installation

**Requirements:** React 19+, `@thebcms/client` ^2.0.1, `@thebcms/types` ^2

```bash
npm i @thebcms/components-react @thebcms/client @thebcms/types
```

---

## Components Overview

| Component          | Import path                        | Purpose                                      |
|-------------------|------------------------------------|----------------------------------------------|
| BCMSImage         | `@thebcms/components-react/image`  | Render BCMS images (IMG, SVG) with optimization |
| BCMSVideo         | `@thebcms/components-react/video`  | Render BCMS video media                      |
| BCMSAudio         | `@thebcms/components-react/audio`  | Render BCMS audio media                      |
| BCMSMedia         | `@thebcms/components-react/media`  | Auto-select component by media type         |
| BCMSContentManager| `@thebcms/components-react/content`| Render entry content (rich text, widgets, media) |
| BCMSContentItem   | `@thebcms/components-react/content/item` | Low-level item renderer                 |

---

## BCMSImage

Renders BCMS media as optimized images. Supports IMG and SVG. Produces responsive `<picture>` with WebP.

### Props

| Prop           | Type                            | Required | Description                                      |
|----------------|---------------------------------|----------|--------------------------------------------------|
| `media`        | `Media \| MediaExtended \| PropMediaDataParsed` | Yes | BCMS media object to display                    |
| `clientConfig` | `ClientConfig`                  | Yes      | BCMS client config (`getConfig()` from `Client`) |
| `altText`      | `string`                        | No       | Alt text (falls back to `media.altText` or `media.name`) |
| `sizeTransform`| `string[]`                      | No       | Limit to specific size transforms                |
| `id`           | `string`                        | No       | Element ID                                      |
| `className`    | `string`                        | No       | CSS class                                       |
| `style`        | `React.CSSProperties`           | No       | Inline style                                    |

### Example

```tsx
import { BCMSImage } from '@thebcms/components-react';
import { bcmsClient } from '../bcms-client';

<BCMSImage
  media={entry.meta.en.cover_image}
  clientConfig={bcmsClient.getConfig()}
  altText={entry.meta.en.title}
  className="rounded-lg"
/>
```

---

## BCMSVideo

Renders BCMS video media as `<video>`.

### Props

| Prop           | Type                            | Required | Description                                      |
|----------------|---------------------------------|----------|--------------------------------------------------|
| `media`        | `Media \| MediaExtended \| PropMediaDataParsed` | Yes | BCMS video media                                |
| `clientConfig` | `ClientConfig`                  | Yes      | BCMS client config                              |
| `controls`     | `boolean`                       | No       | Show video controls                             |
| `autoplay`     | `boolean`                       | No       | Autoplay video                                  |
| `loop`         | `boolean`                       | No       | Loop video                                      |
| `muted`        | `boolean`                       | No       | Mute video                                      |
| `playsinline`  | `boolean`                       | No       | Inline playback (mobile)                         |
| `id`           | `string`                        | No       | Element ID                                      |
| `className`    | `string`                        | No       | CSS class                                       |
| `style`        | `React.CSSProperties`           | No       | Inline style                                    |

### Example

```tsx
import { BCMSVideo } from '@thebcms/components-react';

<BCMSVideo
  media={videoMedia}
  clientConfig={bcmsClient.getConfig()}
  controls
  className="w-full"
/>
```

---

## BCMSAudio

Renders BCMS audio media as `<audio>`.

### Props

| Prop           | Type                            | Required | Description                                      |
|----------------|---------------------------------|----------|--------------------------------------------------|
| `media`        | `Media \| MediaExtended \| PropMediaDataParsed` | Yes | BCMS audio media                                |
| `clientConfig` | `ClientConfig`                  | Yes      | BCMS client config                              |
| `controls`     | `boolean`                       | No       | Show audio controls                             |
| `autoplay`     | `boolean`                       | No       | Autoplay audio                                  |
| `loop`         | `boolean`                       | No       | Loop audio                                      |
| `muted`        | `boolean`                       | No       | Mute audio                                      |
| `playsinline`  | `boolean`                       | No       | Inline playback (mobile)                         |
| `id`           | `string`                        | No       | Element ID                                      |
| `className`    | `string`                        | No       | CSS class                                       |
| `style`        | `React.CSSProperties`           | No       | Inline style                                    |

### Example

```tsx
import { BCMSAudio } from '@thebcms/components-react';

<BCMSAudio
  media={audioMedia}
  clientConfig={bcmsClient.getConfig()}
  controls
/>
```

---

## BCMSMedia

Renders BCMS media by type — automatically uses BCMSImage, BCMSVideo, or BCMSAudio based on `media.type`.

### Props

| Prop           | Type                            | Required | Description                                      |
|----------------|---------------------------------|----------|--------------------------------------------------|
| `media`        | `Media \| MediaExtended \| PropMediaDataParsed` | Yes | BCMS media object                               |
| `clientConfig` | `ClientConfig`                  | Yes      | BCMS client config                              |
| `videoProps`   | `Partial<BCMSVideoProps>`      | No       | Pass-through props for video                     |
| `audioProps`   | `Partial<BCMSAudioProps>`      | No       | Pass-through props for audio                     |
| `imageProps`   | `Partial<BCMSImageProps>`     | No       | Pass-through props for image                     |
| `id`           | `string`                        | No       | Element ID                                      |
| `className`    | `string`                        | No       | CSS class                                       |
| `style`        | `React.CSSProperties`           | No       | Inline style                                    |

### Example

```tsx
import { BCMSMedia } from '@thebcms/components-react';

<BCMSMedia
  media={media}
  clientConfig={bcmsClient.getConfig()}
  videoProps={{ controls: true }}
/>
```

---

## BCMSContentManager

Renders BCMS entry content (rich-text nodes). Handles widgets, media embeds, and primitives. Pass widget components to customize widget rendering.

### Props

| Prop               | Type                         | Required | Description                                      |
|--------------------|------------------------------|----------|--------------------------------------------------|
| `items`            | `EntryContentParsedItem[]`   | Yes      | Content nodes (e.g. `entry.content.en`)          |
| `widgetComponents` | `BCMSWidgetComponents`       | No       | Map of widget name → React component            |
| `nodeParser`       | `(item) => string \| JSX.Element` | No  | Custom renderer for nodes                        |
| `clientConfig`     | `ClientConfig`               | No       | Required for media nodes (images)                |
| `id`               | `string`                     | No       | Element ID                                      |
| `className`        | `string`                     | No       | CSS class                                       |
| `style`            | `React.CSSProperties`        | No       | Inline style                                    |

### BCMSWidgetComponents

Object mapping widget names to React components:

```ts
import type { BCMSWidgetComponents } from '@thebcms/components-react/content';
import { HeroWidget } from './HeroWidget';

const widgetComponents: BCMSWidgetComponents = {
  hero: HeroWidget,
};
```

### Example

```tsx
import { BCMSContentManager } from '@thebcms/components-react';
import type { BCMSWidgetComponents } from '@thebcms/components-react/content';
import { HeroWidget } from './HeroWidget';

const widgetComponents: BCMSWidgetComponents = {
  hero: HeroWidget,
};

<BCMSContentManager
  items={entry.content.en}
  widgetComponents={widgetComponents}
  clientConfig={bcmsClient.getConfig()}
  className="prose max-w-none"
/>
```

---

## BCMSContentItem

Low-level component that renders a single content node. Used internally by BCMSContentManager. Use directly for fine-grained control.

### Props

| Prop           | Type                         | Required | Description                        |
|----------------|------------------------------|----------|------------------------------------|
| `item`         | `EntryContentParsedItem`     | Yes      | Single content node                |
| `components`   | `BCMSWidgetComponents`       | No       | Map of widget name → React component |
| `nodeParser`   | `(item) => string \| JSX.Element` | No  | Custom renderer                    |
| `clientConfig` | `ClientConfig`               | No       | Required for media nodes           |

---

## Links

- [BCMS Next.js Documentation](https://thebcms.com/docs/integrations/next-js) — Setup, integration, examples
- [BCMS Vite Documentation](https://thebcms.com/docs/integrations/vite) — React + Vite setup
- [BCMS Dashboard](https://app.thebcms.com) — Manage content and API keys
- [@thebcms/client](./BCMS-CLIENT.md) — API reference for fetching content
