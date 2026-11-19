import { Component } from "@angular/core";

@Component({
  selector: "app-home-page",
  template: `
    <h1>Home</h1>
    <p>An Angular app that installs the Widget with the Angular Embed.</p>
    <section id="pricing-card">
      <h2>Pricing</h2>
      <p>Every plan includes unlimited Reviewers.</p>
      <button type="button" id="primary-action">Get started</button>
    </section>
  `,
})
export class HomePage {}
