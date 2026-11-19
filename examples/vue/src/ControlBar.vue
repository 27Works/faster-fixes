<script setup lang="ts">
import { useFeedback } from "@fasterfixes/vue";

const { show, hide, isVisible, startAnnotation, feedbackItems, togglePins } =
  useFeedback();
</script>

<template>
  <section aria-label="Widget controls">
    <button type="button" @click="show">Show widget</button>
    <button type="button" @click="hide">Hide widget</button>
    <button type="button" @click="startAnnotation">Start annotation</button>
    <button type="button" @click="togglePins">Toggle pins</button>
    <output data-testid="widget-visible">
      Visible: {{ isVisible ? "yes" : "no" }}
    </output>
    <output data-testid="feedback-count">
      Feedback: {{ feedbackItems.length }}
    </output>
  </section>
</template>
