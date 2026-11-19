import { Component } from "@angular/core";
import { injectFeedback } from "@fasterfixes/angular";

@Component({
  selector: "app-control-bar",
  template: `
    <section aria-label="Widget controls">
      <button type="button" (click)="feedback.show()">Show widget</button>
      <button type="button" (click)="feedback.hide()">Hide widget</button>
      <button type="button" (click)="feedback.startAnnotation()">
        Start annotation
      </button>
      <button type="button" (click)="feedback.togglePins()">Toggle pins</button>
      <output data-testid="widget-visible">
        Visible: {{ feedback.isVisible() ? "yes" : "no" }}
      </output>
      <output data-testid="feedback-count">
        Feedback: {{ feedback.feedbackItems().length }}
      </output>
    </section>
  `,
})
export class ControlBar {
  protected readonly feedback = injectFeedback();
}
