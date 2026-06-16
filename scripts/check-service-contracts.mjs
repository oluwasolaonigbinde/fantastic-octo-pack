import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

await import("./check-auth-contract.mjs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const read = (relativePath) =>
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

const expectMatch = (source, pattern, message) => {
  assert.match(source, pattern, message);
};

const expectNoMatch = (source, pattern, message) => {
  assert.doesNotMatch(source, pattern, message);
};

const authServiceFile = read("services/authService.ts");
const authTypesFile = read("types/auth.ts");
const userServiceFile = read("services/userService.ts");
const productServiceFile = read("services/productService.ts");
const messagingServiceFile = read("services/messagingService.ts");
const messagingRoutesFile = read("utils/messagingRoutes.ts");
const categoryServiceFile = read("services/categoryService.ts");
const rfqServiceFile = read("services/rfqService.ts");
const userSliceFile = read("store/slices/user-slice.ts");
const productSliceFile = read("store/slices/product-slice.ts");
const homePageFile = read("app/page.tsx");
const productsPageFile = read("app/products/ProductPage.client.tsx");
const productDetailPageFile = read("app/products/[id]/page.tsx");
const productInfoFile = read("app/products/[id]/ProductInfo.tsx");
const registerPageFile = read("app/(auth)/register/page.tsx");
const registerSchemaFile = read("app/(auth)/register/register.schema.ts");
const roleToggleFile = read("components/features/auth/RoleToggle.tsx");
const verifyEmailPageFile = read("app/(auth)/verify-email/page.tsx");
const loginPageFile = read("app/(auth)/login/page.tsx");
const publicNavBarFile = read("components/layout/PublicNavBar.tsx");
const publicFooterFile = read("components/layout/PublicFooter.tsx");
const searchAutocompleteFile = read("components/features/search/SearchAutocomplete.tsx");
const distributorPageFile = read("app/distributor/page.tsx");
const distributorProfilePageFile = read("app/distributor/profile/page.tsx");
const oemProfilePageFile = read("app/distributor/oem-profile/page.tsx");

expectMatch(
  authServiceFile,
  /requestJson<RegistrationResponseData, StartRegistrationPayload>\(\s*"\/auth\/register"/,
  "auth service should use /auth/register",
);
expectMatch(
  authServiceFile,
  /requestJson<RegistrationResponseData, VerifyRegistrationEmailPayload>\(\s*"\/auth\/verify-email"/,
  "auth service should use /auth/verify-email",
);
expectMatch(
  authServiceFile,
  /requestJson<\{ verificationCode\?: number \}, \{ pendingRegistrationId: string \}>\(\s*"\/auth\/resend-verification-email"/,
  "auth service should use /auth/resend-verification-email",
);
expectMatch(authServiceFile, /apiUrl\("\/auth\/login"\)/, "auth service should use /auth/login");
expectMatch(authServiceFile, /apiUrl\("\/auth\/logout"\)/, "auth service should use /auth/logout");

expectMatch(userServiceFile, /apiUrl\("\/public\/profiles"\)/, "public profile list should use /public/profiles");
expectMatch(
  userServiceFile,
  /apiUrl\(`\/public\/profiles\/\$\{id\}`\)/,
  "public profile detail should use /public/profiles/:id",
);
expectNoMatch(
  userServiceFile,
  /apiUrl\(`\/users\/\$\{id\}`\)/,
  "supported public profile reads must not use /users/:id",
);
expectNoMatch(
  userServiceFile,
  /\/users\/:id\/status/,
  "supported public profile flows must not depend on /users/:id/status",
);

expectMatch(productServiceFile, /apiUrl\("\/products"\)/, "product service should use /products");
expectMatch(
  productServiceFile,
  /apiUrl\(`\/products\/\$\{id\}\?populate=createdBy,assignedOem`\)/,
  "product detail reads should use /products/:id",
);
expectMatch(
  productServiceFile,
  /createdBy=\$\{id\}/,
  "public profile product reads should keep the createdBy filter on /products",
);

expectMatch(categoryServiceFile, /apiUrl\("\/categories"\)/, "category service should use /categories");
expectMatch(
  categoryServiceFile,
  /apiUrl\(`\/categories\/\$\{categoryId\}`\)/,
  "category detail reads should use /categories/:id",
);

expectMatch(rfqServiceFile, /apiUrl\("\/rfqs"\)/, "RFQ service should use /rfqs");
expectMatch(
  rfqServiceFile,
  /apiUrl\(`\/rfqs\/\$\{rfqId\}`\)/,
  "RFQ detail reads should use /rfqs/:id",
);

expectMatch(
  authTypesFile,
  /interface PendingSendMessageIntent \{\s*action: "send_message";\s*receiverId: string;\s*\}/s,
  "pending send-message intent should keep the exact minimal shape",
);
expectMatch(
  messagingRoutesFile,
  /buyer: "\/dashboard\/buyer\/messages"/,
  "buyer messaging route should be canonical",
);
expectMatch(
  messagingRoutesFile,
  /distributor: "\/dashboard\/distributor\/message"/,
  "distributor messaging route should be canonical",
);
expectMatch(
  messagingRoutesFile,
  /engineer: "\/dashboard\/engineer\/messaging"/,
  "engineer messaging route should be canonical",
);
expectMatch(
  messagingRoutesFile,
  /compose: "1"/,
  "messaging compose route should use compose=1",
);
expectMatch(
  messagingServiceFile,
  /"\/conversations\/start"/,
  "messaging service should start conversations through /conversations/start",
);
expectMatch(
  messagingServiceFile,
  /"\/conversations"/,
  "messaging service should list conversations through /conversations",
);
expectMatch(
  messagingServiceFile,
  /`\/conversations\/\$\{conversationId\}`/,
  "messaging service should read one conversation through /conversations/:id",
);
expectMatch(
  messagingServiceFile,
  /"\/messages\/send"/,
  "messaging service should send messages through /messages/send",
);
expectMatch(
  productDetailPageFile,
  /receiverId: sellerId/,
  "product message handoff should target the listing owner from createdBy",
);
expectNoMatch(
  productDetailPageFile,
  /receiverId:\s*product\?\.assignedOem|assignedOem.*receiverId/s,
  "product messaging must not route to assigned OEM",
);
expectNoMatch(
  productDetailPageFile,
  /ChatWithSeller/,
  "product detail must not use the local ChatWithSeller fake send path",
);
expectMatch(
  productInfoFile,
  /Chat with Seller/,
  "product detail should keep the PNG-backed Chat with Seller label visible",
);
expectMatch(
  loginPageFile,
  /buildMessagingComposeHref/,
  "login resume should route send-message intent through canonical compose URLs",
);
expectMatch(
  rfqServiceFile,
  /apiUrl\("\/rfqs\/quotes\/received"\)/,
  "buyer received quote reads should use /rfqs/quotes/received",
);
expectMatch(
  rfqServiceFile,
  /apiUrl\(`\/rfqs\/quotes\/\$\{quoteId\}`\)/,
  "quote detail reads should use /rfqs/quotes/:id",
);

expectMatch(
  userSliceFile,
  /userService\.getPublicProfiles/,
  "public directory state should read from the public profiles service",
);
expectMatch(
  userSliceFile,
  /userService\.getPublicProfileById/,
  "public profile detail state should read from the public profiles service",
);
expectMatch(
  userSliceFile,
  /export const getUsersThunk = fetchPublicProfiles;/,
  "supported public list pages should alias getUsersThunk to fetchPublicProfiles",
);
expectMatch(
  userSliceFile,
  /export const fetchUserById = fetchPublicProfileById;/,
  "supported public detail pages should alias fetchUserById to fetchPublicProfileById",
);

expectMatch(
  productSliceFile,
  /productService\.fetchWithFilter\(productFilters\)/,
  "marketplace browse should continue using the filtered /products service call",
);
expectMatch(
  productSliceFile,
  /productService\.fetchMyProducts\(request\.id, request\.token\)/,
  "public profile detail pages should continue loading products through /products\?createdBy=",
);

expectMatch(
  homePageFile,
  /Trusted B2B Platform for Sourcing &amp; Procurement in Africa/,
  "homepage shell should keep the hero heading",
);
expectMatch(
  homePageFile,
  /dispatch\(fetchProducts\(\{ limit: FEATURED_PRODUCT_COUNT \}\)\)/,
  "homepage shell should keep the featured products store wiring",
);
expectMatch(homePageFile, /router\.push\("\/products"\)/, "homepage CTA should keep the /products entry point");
expectMatch(homePageFile, /router\.push\("\/register"\)/, "homepage CTA should keep the /register entry point");

expectMatch(productsPageFile, /title=\{searchQuery \? `Results for "\$\{searchQuery\}"` : "All Products"\}/, "products page should keep the All Products shell");
expectMatch(productsPageFile, /await dispatch\(fetchProducts\(params\)\)/, "products page should keep the /products store wiring");
expectMatch(productsPageFile, /<BigLoader \/>/, "products page should keep the loading shell");

expectNoMatch(registerSchemaFile, /"admin"/, "register schema must not reintroduce admin self-signup");

expectMatch(roleToggleFile, /label: "Distributor"/, "register role toggle should keep the distributor option");
expectMatch(roleToggleFile, /label: "Manufacturer"/, "register role toggle should keep the manufacturer option");
expectMatch(roleToggleFile, /label: "Engineer"/, "register role toggle should keep the engineer option");
expectMatch(roleToggleFile, /label: "Buyer"/, "register role toggle should keep the buyer option");
expectNoMatch(roleToggleFile, /label: "Admin"/, "register role toggle must not expose admin self-signup");

expectMatch(
  registerPageFile,
  /Select to continue registration/,
  "register shell should keep the supported role-selection heading",
);
expectMatch(
  registerSchemaFile,
  /You must accept the Terms & Condition and Privacy Policy to proceed\./,
  "register shell should keep the inline terms validation message",
);
expectMatch(
  registerPageFile,
  /router\.push\("\/verify-email"\)/,
  "register success flow should continue handing off to /verify-email",
);
expectMatch(registerPageFile, /title="Sign up"/, "register shell should keep the submit button");

expectMatch(
  verifyEmailPageFile,
  /Verify your email address/,
  "verify-email shell should keep the verification heading",
);
expectMatch(
  verifyEmailPageFile,
  /authService\.verifyRegistrationEmail/,
  "verify-email shell should keep the OTP verification action",
);
expectMatch(
  verifyEmailPageFile,
  /authService\.resendRegistrationOtp/,
  "verify-email shell should keep the resend verification action",
);
expectMatch(
  verifyEmailPageFile,
  /router\.replace\("\/register"\)/,
  "verify-email shell should redirect missing context back to /register",
);
expectMatch(
  verifyEmailPageFile,
  /A fresh verification code was sent to/,
  "verify-email shell should keep the resend confirmation message",
);

expectMatch(loginPageFile, /Welcome back!/, "login shell should keep the supported heading");
expectMatch(
  loginPageFile,
  /authService\.login/,
  "login shell should keep the /auth/login action",
);
expectMatch(
  loginPageFile,
  /readPendingAuthIntent/,
  "login shell should keep pending-auth resume support",
);
expectMatch(loginPageFile, /title="Sign in"/, "login shell should keep the submit button");

expectNoMatch(
  publicNavBarFile,
  /Distributor\/OEMs/,
  "public shell nav should remove Distributor/OEMs as a promoted entry point",
);
expectMatch(
  publicNavBarFile,
  /scope="public-universal"/,
  "public shell nav should wire the universal direct-match search",
);
expectMatch(
  publicNavBarFile,
  /placeholder="Search"/,
  "public shell nav should use the compact Search label",
);
expectNoMatch(
  publicFooterFile,
  /label: "Distributors"/,
  "public footer should remove the distributor quick-link promotion",
);
expectMatch(
  searchAutocompleteFile,
  /const MIN_QUERY_LENGTH = 2;/,
  "public universal search should require at least 2 characters",
);
expectMatch(
  searchAutocompleteFile,
  /const SEARCH_DEBOUNCE_MS = 300;/,
  "public universal search should debounce requests",
);
expectMatch(
  searchAutocompleteFile,
  /userService\.getPublicProfiles\(1, UNIVERSAL_GROUP_LIMIT, \[UserRole\.DISTRIBUTOR\], term\)/,
  "public universal search should fetch distributor matches directly from /public/profiles",
);
expectMatch(
  searchAutocompleteFile,
  /userService\.getPublicProfiles\(1, UNIVERSAL_GROUP_LIMIT, \[UserRole\.OEM\], term\)/,
  "public universal search should fetch OEM matches directly from /public/profiles",
);
expectMatch(
  searchAutocompleteFile,
  /userService\.getPublicProfiles\(1, UNIVERSAL_GROUP_LIMIT, \[UserRole\.ENGINEER\], term\)/,
  "public universal search should fetch engineer matches directly from /public/profiles",
);
expectMatch(
  searchAutocompleteFile,
  /Type at least \{MIN_QUERY_LENGTH\} characters/,
  "public universal search should keep the minimum-query hint",
);
expectMatch(
  searchAutocompleteFile,
  /universalSections\.length === 0/,
  "public universal search should only render result groups when matches exist",
);

expectMatch(
  distributorPageFile,
  /fetchPublicProfiles/,
  "public distributor directory should use the public profile thunk",
);
expectMatch(
  distributorPageFile,
  /roles:\s*rolesForFilter\(roleValue\)/,
  "public distributor directory should pass explicit public profile roles",
);
expectMatch(
  distributorPageFile,
  /return \[UserRole\.DISTRIBUTOR, UserRole\.OEM\];/,
  "public distributor directory should default to distributor and OEM roles",
);
expectNoMatch(
  distributorPageFile,
  /getUsersThunk/,
  "public distributor directory must not depend on the legacy getUsersThunk alias",
);
expectNoMatch(
  distributorPageFile,
  /userData|backendCompanies|filtered\?\.map|\.filter\(\(company\)/,
  "public distributor directory must not keep client-side fallback filtering",
);
expectNoMatch(
  distributorPageFile,
  /includeFacets/,
  "public distributor directory should not request facet metadata",
);
expectMatch(
  distributorPageFile,
  /Loading users\.\.\./,
  "public distributor directory should keep the loading state",
);
expectMatch(
  distributorPageFile,
  /No users match your search\/filter\./,
  "public distributor directory should keep the empty state",
);
expectMatch(
  distributorPageFile,
  /\/distributor\/profile\?id=\$\{company\._id\}/,
  "public distributor directory should keep distributor profile navigation",
);
expectMatch(
  distributorPageFile,
  /\/distributor\/oem-profile\?id=\$\{company\._id\}/,
  "public distributor directory should keep OEM profile navigation",
);

expectMatch(
  distributorProfilePageFile,
  /userService\.getPublicProfileById\(selectedId\)/,
  "distributor profile page should read the public profile detail from /public/profiles/:id",
);
expectMatch(
  distributorProfilePageFile,
  /productService\.fetchWithFilter\(\{/,
  "distributor profile page should load listed products through the filtered /products service",
);
expectMatch(
  distributorProfilePageFile,
  /createdBy: selectedId/,
  "distributor profile page should keep the createdBy product filter",
);
expectMatch(
  distributorProfilePageFile,
  /Report For Scam/,
  "distributor profile page should keep the PNG-backed scam-report control visible",
);
expectMatch(
  distributorProfilePageFile,
  /Send Message/,
  "distributor profile page should keep the PNG-backed message control visible",
);
expectMatch(
  distributorProfilePageFile,
  /Share Review/,
  "distributor profile page should keep the review action affordance visible",
);
expectMatch(
  distributorProfilePageFile,
  /No public products are listed for this distributor yet\./,
  "distributor profile page should keep the new public empty state copy",
);

expectMatch(
  oemProfilePageFile,
  /getPublicProfileById\(selectedId\)/,
  "OEM profile page should keep the public profile detail wiring",
);
expectMatch(
  oemProfilePageFile,
  /assignedOem:\s*selectedId/,
  "OEM profile page should keep the linked OEM product wiring",
);
expectMatch(
  oemProfilePageFile,
  /Source Item/,
  "OEM profile page should keep the source item affordance visible",
);
expectMatch(
  oemProfilePageFile,
  /Send Message/,
  "OEM profile page should keep the message affordance visible",
);
expectMatch(
  oemProfilePageFile,
  /Failed to load products\./,
  "OEM profile page should keep the product error state",
);
expectMatch(
  oemProfilePageFile,
  /No products found for this OEM\./,
  "OEM profile page should keep the empty state",
);

console.log("PASS service contract checks");
