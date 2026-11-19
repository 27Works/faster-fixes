<script lang="ts">
  import type { Component } from "svelte";
  import type { WidgetOptions } from "@fasterfixes/widget";
  import type { GetFeedbackReturn } from "../get-feedback.js";
  import { initFasterFixes } from "../init-faster-fixes.js";
  import Probe from "./Probe.svelte";

  let {
    options,
    probes = 1,
    onFeedback,
    child: Child,
  }: {
    options: WidgetOptions;
    probes?: number;
    onFeedback?: (feedback: GetFeedbackReturn) => void;
    child?: Component;
  } = $props();

  // svelte-ignore state_referenced_locally
  initFasterFixes(options);
</script>

{#if Child}
  <Child />
{:else}
  {#each Array.from({ length: probes }) as _, index (index)}
    <Probe {onFeedback} />
  {/each}
{/if}
