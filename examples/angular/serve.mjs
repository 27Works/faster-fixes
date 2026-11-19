import { spawn } from "node:child_process";
import process from "node:process";

// Angular CLI has no `import.meta.env`, so the two variables reach the app
// through `define`. Both keys are always defined: a `process.env` member left
// undefined would be a reference error in the browser.
const defines = ["NEXT_PUBLIC_FF_API_KEY", "NEXT_PUBLIC_FF_API_ORIGIN"].flatMap(
  (name) => [
    "--define",
    `process.env.${name}=${JSON.stringify(process.env[name] ?? "")}`,
  ],
);

const child = spawn("ng", ["serve", ...defines, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 1));
