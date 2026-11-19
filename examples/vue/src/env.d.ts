/// <reference types="vite/client" />

// ESLint's type checker cannot read SFCs; vue-tsc resolves the real types.
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}
