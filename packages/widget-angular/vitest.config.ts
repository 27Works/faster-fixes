import { defineConfig } from "vitest/config";

export default defineConfig({
  // The server test's probe component is the one decorated class; Angular's JIT
  // compiler reads the metadata legacy decorators emit.
  oxc: { decorator: { legacy: true } },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
    passWithNoTests: true,
  },
});
