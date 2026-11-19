/** @type {import("@sveltejs/kit").Config} */
export default {
  kit: {
    // Reads the web app's variable names, so Playwright configures both servers alike.
    env: { publicPrefix: "NEXT_PUBLIC_FF_" },
  },
};
