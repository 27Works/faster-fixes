# @27works/faster-fixes-react

> Fork of [`@fasterfixes/react`](https://github.com/manucoffin/faster-fixes), MIT licensed.
> Published under our own scope to fix scroll-aware screenshot capture — see
> [NOTICE](./NOTICE) and [Known limitations](#known-limitations) below. Public API and
> wire protocol are otherwise byte-for-byte compatible with upstream: swap the import,
> nothing else changes.

> **[Documentation](https://faster-fixes.com/docs)** · [Website](https://faster-fixes.com)

React feedback widget for [FasterFixes](https://faster-fixes.com) — collect visual feedback with screenshots, element annotations, and inline comments.

## Installation

```bash
npm install @27works/faster-fixes-react
```

The `projectId` prop requires `@fasterfixes/react` version 0.0.9 or later (this fork starts from that baseline).

## Quick start

Wrap your app with `FeedbackProvider`:

```tsx
import { FeedbackProvider } from "@27works/faster-fixes-react";

function App() {
  return (
    <FeedbackProvider projectId="proj_your_project_id">
      <YourApp />
    </FeedbackProvider>
  );
}
```

That's it. The widget appears as a floating button. Reviewers with a valid token can click elements, annotate them, and submit feedback with automatic screenshots.

### Customize appearance

```tsx
<FeedbackProvider
  projectId="proj_your_project_id"
  color="#e63946"
  position="bottom-left"
>
  <YourApp />
</FeedbackProvider>
```

`color` accepts any CSS color value, including CSS variables:

```tsx
<FeedbackProvider projectId="proj_your_project_id" color="var(--brand-primary)">
```

The color is applied as a `--ff-accent` CSS custom property on the widget root. Any `classNames` overrides take precedence.

## How it works

1. A reviewer visits your site with a token link (`?ff_token=...`)
2. They click the floating widget button to enter feedback mode
3. They click any element on the page to annotate it
4. A comment popover appears — they describe the issue and submit
5. A screenshot is captured automatically and uploaded with the feedback
6. Feedback pins appear on the page showing existing feedback items

## Props

### `FeedbackProvider`

| Prop         | Type                  | Required | Description                                                       |
| ------------ | --------------------- | -------- | ---------------------------------------------------------------- |
| `projectId`  | `string`              | Yes      | Your Faster Fixes Project ID (found in project settings)         |
| `apiKey`     | `string`              | No       | Deprecated alias for `projectId`; removed in a future major.     |
| `apiOrigin`  | `string`              | No       | Custom API origin (default: `https://www.faster-fixes.com`)      |
| `color`      | `string`              | No       | Widget accent color — any CSS color value (default: `#02527E`)   |
| `position`   | `WidgetPosition`      | No       | Floating button position (default: `bottom-right`)               |
| `classNames` | `Partial<ClassNames>` | No       | CSS class overrides for widget elements                          |
| `labels`     | `Partial<Labels>`     | No       | Custom UI text labels                                            |

### `useFeedback` hook

Control the widget programmatically:

```tsx
import { useFeedback } from "@27works/faster-fixes-react";

function MyComponent() {
  const {
    show,
    hide,
    isVisible,
    startAnnotation,
    feedbackItems,
    togglePins,
    showPins,
  } = useFeedback();

  return (
    <button onClick={() => (isVisible ? hide() : show())}>
      Toggle feedback widget
    </button>
  );
}
```

| Property          | Type             | Description                           |
| ----------------- | ---------------- | ------------------------------------- |
| `show`            | `() => void`     | Show the widget                       |
| `hide`            | `() => void`     | Hide the widget and reset mode        |
| `isVisible`       | `boolean`        | Whether the widget is currently shown |
| `startAnnotation` | `() => void`     | Enter annotation mode directly        |
| `feedbackItems`   | `FeedbackItem[]` | All feedback items for the project    |
| `togglePins`      | `() => void`     | Toggle pin visibility on the page     |
| `showPins`        | `boolean`        | Whether pins are currently visible    |

## Features

- Visual element annotation with click-to-select
- Automatic screenshot capture
- Edit and delete existing feedback
- Resolved feedback filtering
- Dark mode UI
- Animated toolbar with list and visibility toggles
- Feedback pins positioned on annotated elements
- Element highlighting on hover and active feedback
- Cross-page feedback list with navigation
- Configurable position (corners, middle-left, middle-right)
- Configurable accent color
- Custom CSS class overrides
- Custom text labels
- SPA navigation support (URL change detection)
- Full keyboard support (Escape to cancel)

## Browser support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## Known limitations

### Fixed-position elements are not captured correctly on scrolled pages

Screenshot capture renders the full page and crops to the current viewport so the
screenshot reflects what the reviewer is actually looking at, not the top of the page.
This relies on `modern-screenshot`'s full-page render, which does not keep
`position: fixed` elements (e.g. sticky headers/footers) pinned to the viewport during
that render — they end up misplaced or missing from the cropped result once the page is
scrolled. On an unscrolled page this doesn't manifest, since the viewport crop and the
document top coincide.

This is a known upstream limitation of `modern-screenshot`, not something introduced by
this fork's fix. We chose not to work around it with a `transform: translate()`-based
capture, since that approach fixes fixed-element placement at the cost of reintroducing
incorrect scroll rendering for the rest of the page — a worse trade-off for our use case.
If this is fixed upstream in `modern-screenshot` or in
[`manucoffin/faster-fixes`](https://github.com/manucoffin/faster-fixes), this fork can be
retired in favor of the canonical package.

## License

[MIT](./LICENSE). This package is a fork of
[`@fasterfixes/react`](https://github.com/manucoffin/faster-fixes) — see [NOTICE](./NOTICE)
for details on what changed.
