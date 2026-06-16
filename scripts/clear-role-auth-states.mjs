import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const authDir = path.resolve(projectRoot, "playwright", ".auth");

if (!fs.existsSync(authDir)) {
  console.log(`No role auth state directory found at ${authDir}`);
  process.exit(0);
}

const removedFiles = fs
  .readdirSync(authDir)
  .filter((entry) => entry.endsWith(".json"))
  .map((entry) => path.join(authDir, entry))
  .filter((filePath) => fs.existsSync(filePath));

for (const filePath of removedFiles) {
  fs.unlinkSync(filePath);
  console.log(`removed ${filePath}`);
}

if (removedFiles.length === 0) {
  console.log(`No role auth state files found in ${authDir}`);
}
