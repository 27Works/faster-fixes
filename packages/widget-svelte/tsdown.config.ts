import { defineConfig } from "tsdown";

// The package holds no .svelte file, .svelte.ts module or rune, so plain ESM is
// enough and svelte-package is not needed. Adding one moves the build to it.
export default defineConfig({
  entry: ["./src/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  platform: "browser",
  deps: {
    neverBundle: ["svelte"],
  },
});
