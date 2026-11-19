# @fasterfixes/svelte

Svelte integration for the [FasterFixes](https://faster-fixes.com) feedback widget, for Svelte and SvelteKit apps.

[![npm version](https://img.shields.io/npm/v/@fasterfixes/svelte?color=0a0a0a)](https://www.npmjs.com/package/@fasterfixes/svelte)
[![license](https://img.shields.io/npm/l/@fasterfixes/svelte?color=0a0a0a)](https://github.com/manucoffin/faster-fixes/blob/main/packages/widget-svelte/LICENSE)

## Install

```bash
npm install @fasterfixes/svelte
```

## Usage

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { initFasterFixes } from "@fasterfixes/svelte";

  let { children } = $props();

  initFasterFixes({ projectId: "proj_your_project_id" });
</script>

{@render children()}
```

```svelte
<script lang="ts">
  import { getFeedback } from "@fasterfixes/svelte";

  const feedback = getFeedback();
</script>

<button onclick={feedback.startAnnotation}>Report an issue</button>
```

## Documentation

[faster-fixes.com/docs/widget/install/svelte](https://faster-fixes.com/docs/widget/install/svelte)

## Licence

MIT
