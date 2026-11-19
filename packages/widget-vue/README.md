# @fasterfixes/vue

Vue plugin for the [FasterFixes](https://faster-fixes.com) feedback widget, for Vue and Nuxt apps.

[![npm version](https://img.shields.io/npm/v/@fasterfixes/vue?color=0a0a0a)](https://www.npmjs.com/package/@fasterfixes/vue)
[![license](https://img.shields.io/npm/l/@fasterfixes/vue?color=0a0a0a)](https://github.com/manucoffin/faster-fixes/blob/main/packages/widget-vue/LICENSE)

## Install

```bash
npm install @fasterfixes/vue
```

## Usage

```ts
// main.ts
import { createApp } from "vue";
import { createFasterFixes } from "@fasterfixes/vue";
import App from "./App.vue";

createApp(App)
  .use(createFasterFixes({ projectId: "proj_your_project_id" }))
  .mount("#app");
```

```vue
<script setup lang="ts">
import { useFeedback } from "@fasterfixes/vue";

const { startAnnotation } = useFeedback();
</script>

<template>
  <button @click="startAnnotation">Report an issue</button>
</template>
```

## Documentation

[faster-fixes.com/docs/widget/install/vue](https://faster-fixes.com/docs/widget/install/vue)

## Licence

MIT
