# @fasterfixes/angular

Angular provider for the [FasterFixes](https://faster-fixes.com) feedback widget, for Angular and Analog apps.

[![npm version](https://img.shields.io/npm/v/@fasterfixes/angular?color=0a0a0a)](https://www.npmjs.com/package/@fasterfixes/angular)
[![license](https://img.shields.io/npm/l/@fasterfixes/angular?color=0a0a0a)](https://github.com/manucoffin/faster-fixes/blob/main/packages/widget-angular/LICENSE)

## Install

```bash
npm install @fasterfixes/angular
```

## Usage

```ts
// app.config.ts
import type { ApplicationConfig } from "@angular/core";
import { provideFasterFixes } from "@fasterfixes/angular";

export const appConfig: ApplicationConfig = {
  providers: [provideFasterFixes({ projectId: "proj_your_project_id" })],
};
```

```ts
import { Component } from "@angular/core";
import { injectFeedback } from "@fasterfixes/angular";

@Component({
  selector: "app-report-button",
  template: `<button (click)="feedback.startAnnotation()">
    Report an issue
  </button>`,
})
export class ReportButton {
  protected readonly feedback = injectFeedback();
}
```

## Documentation

[faster-fixes.com/docs/widget/install/angular](https://faster-fixes.com/docs/widget/install/angular)

## Licence

MIT
