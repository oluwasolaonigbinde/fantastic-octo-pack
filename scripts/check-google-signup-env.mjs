import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(projectRoot, "..", "..");

const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
};

const resolveEnvValue = (key, filePaths) => {
  const processValue = process.env[key]?.trim();
  if (processValue) {
    return { value: processValue, source: "process.env" };
  }

  for (const filePath of filePaths) {
    const fileValue = readEnvFile(filePath)[key]?.trim();

    if (fileValue) {
      return {
        value: fileValue,
        source: path.relative(projectRoot, filePath) || path.basename(filePath),
      };
    }
  }

  return { value: "", source: "unresolved" };
};

const frontendClientId = resolveEnvValue("NEXT_PUBLIC_GOOGLE_CLIENT_ID", [
  path.join(projectRoot, ".env.local"),
  path.join(projectRoot, ".env"),
]);
const backendClientId = resolveEnvValue("GOOGLE_CLIENT_ID", [
  path.join(repoRoot, "buiy-backend", "baiy-server", ".env"),
  path.join(repoRoot, "buiy-backend", "baiy-server", ".env.example"),
]);

const failures = [];
const notices = [];

if (!frontendClientId.value) {
  failures.push(
    "Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID. Google-assisted signup cannot initialize without it.",
  );
}

if (frontendClientId.value && backendClientId.value) {
  if (frontendClientId.value !== backendClientId.value) {
    failures.push(
      `Google client ID mismatch: frontend resolved from ${frontendClientId.source} but backend resolved from ${backendClientId.source}.`,
    );
  }
} else if (!backendClientId.value) {
  notices.push(
    "GOOGLE_CLIENT_ID was not resolved, so backend parity comparison was skipped.",
  );
}

if (failures.length > 0) {
  console.error("FAIL Google signup env checks");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  for (const notice of notices) {
    console.error(`- ${notice}`);
  }
  process.exit(1);
}

console.log("PASS Google signup env checks");
console.log(
  `- NEXT_PUBLIC_GOOGLE_CLIENT_ID resolved from ${frontendClientId.source}`,
);

if (backendClientId.value) {
  console.log(`- GOOGLE_CLIENT_ID resolved from ${backendClientId.source}`);
} else {
  for (const notice of notices) {
    console.log(`- ${notice}`);
  }
}
