<script lang="ts">
  import { onMount } from "svelte";
  import { getFeedback } from "../get-feedback.js";

  const feedback = getFeedback();
  onMount(() => feedback.show());
</script>
