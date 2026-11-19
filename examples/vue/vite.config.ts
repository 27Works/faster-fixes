import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  // Reads the web app's variable names, so Playwright configures both servers alike.
  envPrefix: "NEXT_PUBLIC_FF_",
  server: { port: 3200, strictPort: true },
});
