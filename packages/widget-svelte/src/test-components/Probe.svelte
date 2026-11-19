<script lang="ts">
  import { getFeedback } from "../get-feedback.js";
  import type { GetFeedbackReturn } from "../get-feedback.js";

  let {
    onFeedback,
  }: { onFeedback?: (feedback: GetFeedbackReturn) => void } = $props();

  const feedback = getFeedback();
  // svelte-ignore state_referenced_locally
  onFeedback?.(feedback);
</script>

<p>{feedback.isVisible}-{feedback.feedbackItems.length}-{feedback.showPins}</p>
