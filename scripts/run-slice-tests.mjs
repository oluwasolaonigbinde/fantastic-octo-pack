import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const playwrightBin = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "playwright.cmd" : "playwright",
);

const requestedArgs = process.argv.slice(2);
const targetArgs = requestedArgs.length > 0 ? requestedArgs : ["e2e/slices"];

const result = spawnSync(playwrightBin, ["test", ...targetArgs], {
  cwd: projectRoot,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
