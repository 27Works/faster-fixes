<script lang="ts">
  import { getFeedback } from "@fasterfixes/svelte";

  // Read state as `feedback.isVisible`: destructuring loses reactivity.
  const feedback = getFeedback();
</script>

<section aria-label="Widget controls">
  <button type="button" onclick={feedback.show}>Show widget</button>
  <button type="button" onclick={feedback.hide}>Hide widget</button>
  <button type="button" onclick={feedback.startAnnotation}>
    Start annotation
  </button>
  <button type="button" onclick={feedback.togglePins}>Toggle pins</button>
  <output data-testid="widget-visible">
    Visible: {feedback.isVisible ? "yes" : "no"}
  </output>
  <output data-testid="feedback-count">
    Feedback: {feedback.feedbackItems.length}
  </output>
</section>
