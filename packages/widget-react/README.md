# @fasterfixes/react

React provider and hook for the [FasterFixes](https://faster-fixes.com) feedback widget, for React, Next.js, Remix and TanStack Start apps.

[![npm version](https://img.shields.io/npm/v/@fasterfixes/react?color=0a0a0a)](https://www.npmjs.com/package/@fasterfixes/react)
[![license](https://img.shields.io/npm/l/@fasterfixes/react?color=0a0a0a)](https://github.com/manucoffin/faster-fixes/blob/main/packages/widget-react/LICENSE)

## Install

```bash
npm install @fasterfixes/react
```

## Usage

```tsx
import { FeedbackProvider, useFeedback } from "@fasterfixes/react";

export function App() {
  return (
    <FeedbackProvider projectId="proj_your_project_id">
      <ReportButton />
    </FeedbackProvider>
  );
}

function ReportButton() {
  const { startAnnotation } = useFeedback();

  return <button onClick={startAnnotation}>Report an issue</button>;
}
```

## Documentation

[faster-fixes.com/docs/widget/install/react](https://faster-fixes.com/docs/widget/install/react)

## Licence

MIT
