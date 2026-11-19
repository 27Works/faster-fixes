import { defineConfig } from "tsdown";

// The package holds no decorator, so plain ESM is enough: the Angular linker only
// rewrites files with partial-compilation declarations. The day a decorator enters
// the package, the build moves to ng-packagr.
export default defineConfig({
  entry: ["./src/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  platform: "browser",
  deps: {
    neverBundle: ["@angular/core", "@angular/common"],
  },
});
