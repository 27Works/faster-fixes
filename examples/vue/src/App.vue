<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import ControlBar from "./ControlBar.vue";
</script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/second">Second page</RouterLink>
  </nav>
  <ControlBar />
  <main>
    <RouterView />
  </main>
</template>
