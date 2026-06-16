import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const read = (relativePath) =>
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

const authTypesFile = read("types/auth.ts");
const authServiceFile = read("services/authService.ts");
const registerPageFile = read("app/(auth)/register/page.tsx");
const loginPageFile = read("app/(auth)/login/page.tsx");
const selectRolePageFile = read("app/(auth)/select-role/page.tsx");
const completeSignupPageFile = read("app/(auth)/complete-signup/page.tsx");
const pendingAuthFile = read("utils/pendingAuth.ts");

assert.match(authTypesFile, /"complete_signup"/);
assert.match(authTypesFile, /"apple"/);

assert.match(authServiceFile, /"\/auth\/social-auth"/);
assert.match(authServiceFile, /"\/auth\/complete-social-signup"/);
assert.match(authServiceFile, /provider: "google" \| "apple"/);

assert.match(pendingAuthFile, /case "complete_signup":\s*return "\/complete-signup";/s);

assert.match(registerPageFile, /SocialProviderButtons/);
assert.match(registerPageFile, /setMode\("email"\)/);
assert.match(registerPageFile, /authService\.startRegistration/);
assert.match(registerPageFile, /mode="signup"/);

assert.match(loginPageFile, /SocialProviderButtons/);
assert.match(loginPageFile, /mode="login"/);
assert.match(loginPageFile, /authService\.login/);

assert.match(completeSignupPageFile, /authService\.completeSocialSignup/);
assert.match(completeSignupPageFile, /phoneNumber/);

assert.match(selectRolePageFile, /dispatch\(setUser\(authenticatedUser\)\)/);
assert.match(selectRolePageFile, /mapAuthStepToPath\(nextContext\.nextStep\)/);

console.log("PASS auth contract checks");
