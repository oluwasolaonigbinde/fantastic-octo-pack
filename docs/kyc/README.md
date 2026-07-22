# KYC — Frontend Reference

Reference contract for the KYC / verification-tier flows. Written against
`baiy-server` commit **`0558e4a feat: add kyc`**.

**Read this before building any role's KYC UI.** The service layer, types, and
tier catalogue are already aligned to the server — the remaining work is
per-role presentation.

Server source of truth (do not guess, read these if in doubt):

| Concern | File |
| --- | --- |
| Tier catalogue, upload limits | `baiy-server/src/features/kyc/config.ts` |
| Routes + auth | `baiy-server/src/routes/kycRouter.ts` |
| Response shapes | `baiy-server/src/features/kyc/presenter.ts` |
| Validation rules | `baiy-server/src/features/kyc/service.ts` |
| Persisted model / statuses | `baiy-server/src/features/kyc/schema.ts` |

---

## 1. Frontend files

| File | Role |
| --- | --- |
| `types/kyc.ts` | Contract types + upload constraints. Mirrors the server. |
| `constants/kycTiers.ts` | Static tier catalogue mirror — slugs, route params, required fields. |
| `services/kycService.ts` | API client. All endpoints. |
| `hooks/queries/kyc.ts` | TanStack Query hooks. Use these, not the service directly. |
| `components/kyc/config.ts` | Shared role copy, upload `accept`, read-only field builder. |
| `components/kyc/buyer-kyc-view.tsx` | **Buyer — done.** Reference implementation for the state model below. |
| `components/kyc/oem-kyc-view.tsx` | OEM-specific view. Multi-file uploads. |
| `components/kyc/engineer-kyc-view.tsx` | Engineer-specific view. |
| `components/kyc/distributor-kyc-view.tsx` | Distributor-specific view. |
| `components/kyc/admin-kyc-management.tsx` | Admin review queue — stats, filters, table. |
| `components/kyc/admin-kyc-review-drawer.tsx` | Approve / reject / mark-under-review. |
| `components/kyc/admin-kyc-premium-grant.tsx` | Grants `admin_only` tiers by `userId`. |
| `app/dashboard/<role>/kyc-verification/[tier]/page.tsx` | Thin route wrappers. |

Roles get their own view component as they're built out — they diverge enough
that sharing one becomes a net loss. Buyer, distributor and engineer are split
out already, as are OEM and engineer. **`buyer-kyc-view.tsx` is the
pattern to copy** — it implements every state in §6.

The API is authoritative at runtime — always render from `useMyKycQuery()`.
`constants/kycTiers.ts` is for the things that can't wait on a request:
`generateStaticParams`, slug validation, and links built before the query resolves.
If the server config changes, update that mirror in the same PR.

---

## 2. Endpoints

Base path `/kyc`. All routes require a bearer token.

### Submitter — buyer, distributor, oem, engineer

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/kyc/tiers` | Tier catalogue for the caller's role |
| GET | `/kyc/submissions` | Own submissions. Filters: `status`, `kycLevel` |
| GET | `/kyc/submissions/:id` | One submission |
| POST | `/kyc/submissions` | **multipart/form-data** — create + upload in one request |

### Admin — admin, super_admin

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/kyc/admin/submissions` | Review queue. Filters: `status`, `kycLevel`, `userCategory`, `date`, `page`, `limit` |
| GET | `/kyc/admin/submissions/:id` | Detail, with `user` + `reviewer` populated |
| PATCH | `/kyc/admin/submissions/:id/under-review` | `submitted` → `under_review` |
| GET | `/kyc/admin/tiers` | All tiers, all roles. Filters: `role`, `submissionBehavior` |
| PATCH | `/kyc/admin/tiers/:tierKey/approve` | Body `{ submissionId? , userId? }` |
| PATCH | `/kyc/admin/tiers/:tierKey/reject` | Body `{ submissionId, rejectionReason }` |
| GET | `/kyc/admin/stats` | Summary cards |

Every response is `{ success, message, data }` (`KycApiEnvelope<T>`).
`/kyc/admin/submissions` may return a bare array **or** a paginated envelope —
`useAdminKycListQuery` already normalises this.

### Two breaking changes vs. the old frontend

1. **There is no `/kyc/upload` endpoint.** It never existed on this server.
   Documents upload to Cloudinary inside `POST /kyc/submissions`.
2. **Approve/reject is keyed by tier, not submission.**
   `PATCH /kyc/admin/tiers/:tierKey/approve` — not `/submissions/:id/approve`.

---

## 3. Submitting — multipart, one request

The single most important mechanic. `POST /kyc/submissions` is
`multipart/form-data` handled by `multer.any()`:

- `tierKey` — form field.
- **Every other non-file field becomes a text field**, verbatim. The server does
  `const { tierKey, ...textFields } = req.body`. Field names must match the
  tier's `requiredTextFields[].fieldName` exactly.
- **Each file's form field name is the document's `fieldName`**, matching
  `requiredDocuments[].fieldName`. Repeat the same name to send multiple files
  for one requirement (e.g. `factory_images`).

Never set `Content-Type` yourself — the browser must set the multipart boundary.
`kycService.createSubmission` handles all of this; pass `File` objects:

```ts
const createSubmission = useCreateKycSubmissionMutation();

await createSubmission.mutateAsync({
  tierKey: "verified_distributor",
  textFields: {
    identityDocumentType: "NIN",
    identityDocumentNumber: "12345678901",
  },
  documents: [
    { fieldName: "identity_document", file: idFile },
    { fieldName: "cac_certificate", file: cacFile },
    { fieldName: "cac_status_report", file: statusFile },
  ],
});
```

### Upload constraints (enforced server-side, mirror in the UI)

| Rule | Value |
| --- | --- |
| Extensions | `.doc .docx .pdf .jpg .jpeg .png .webp` |
| MIME types | pdf, msword, docx, jpeg, png, webp |
| Max size | 5 MB per file |
| Max files | 10 per request |

Exported as `KYC_ALLOWED_UPLOAD_EXTENSIONS`, `KYC_ALLOWED_MIME_TYPES`,
`KYC_UPLOAD_MAX_FILE_SIZE_BYTES`, `KYC_UPLOAD_MAX_FILES`, and `KYC_UPLOAD_ACCEPT`
(ready for an `<input accept>`) from `@/types/kyc`.

If any upload fails mid-request the server destroys the already-uploaded
Cloudinary assets and returns an error — submissions are all-or-nothing.

---

## 4. Tier matrix

`submissionBehavior` drives what the UI must render:

- **`none`** — auto-granted at signup. No form, no CTA. Show as already held.
- **`review_required`** — render the form; user submits; admin reviews.
- **`admin_only`** — Premium tiers. **No submit CTA ever.** Explain that Baiy
  admins award it. Attempting a submission is rejected server-side.

`prerequisiteTierKey` must be **approved** before a tier accepts a submission —
gate the CTA on it and say which tier is blocking.

### Buyer

| # | tierKey | routeSlug | Label | Behavior | Requires |
| --- | --- | --- | --- | --- | --- |
| 1 | `basic_buyer` | `basic_buyer` | Basic Buyer | `none` | — |
| 2 | `verified_business_buyer` | `verified-business-buyer` | Verified Business Buyer | `review_required` | docs: `cac_certificate`, `cac_status_report` |

Badge: `Verified Business Buyer`. No prerequisites.

### Distributor

| # | tierKey | routeSlug | Label | Behavior | Requires |
| --- | --- | --- | --- | --- | --- |
| 1 | `basic_distributor` | `basic_distributor` | Basic Distributor | `none` | — |
| 2 | `registered_distributor` | `registered-distributor` | Registered Distributor | `review_required` | text: `countryOfOrigin`, `businessName`, `state`, `city` |
| 3 | `verified_distributor` | `verified-distributor` | Verified Distributor | `review_required` | text: `identityDocumentType`, `identityDocumentNumber` · docs: `identity_document`, `cac_certificate`, `cac_status_report` |
| 4 | `premium_distributor` | `premium-distributor` | Premium Distributor | `admin_only` | — |

Prereqs: 3 needs 2 approved · 4 needs 3 approved.
Badges: tier 3 `Verified Distributor`, tier 4 `Premium Distributor`. Tier 2 has **no badge**.
**Tier 2 approval activates the marketplace account** (`marketplaceAccountLevel: registered`).

### OEM

| # | tierKey | routeSlug | Label | Behavior | Requires |
| --- | --- | --- | --- | --- | --- |
| 1 | `basic_oem` | `basic_oem` | Basic OEM | `none` | — |
| 2 | `registered_manufacturer` | `registered-manufacturer` | Registered Manufacturer | `review_required` | text: `companyName`, `countryOfOrigin`, `state`, `city`, `companyAddress` · docs: `national_id_document` |
| 3 | `verified_manufacturer` | `verified-manufacturer` | Verified Manufacturer | `review_required` | docs: `business_registration_certificate`, `factory_images`, `supporting_document` |
| 4 | `premium_manufacturer` | `premium-manufacturer` | Premium Manufacturer | `admin_only` | — |

Prereqs: 4 needs 3 approved. **Tier 3 has no prerequisite** — it does not require tier 2.
Badges: tier 3 `Verified Manufacturer`, tier 4 `Premium Manufacturer`. Tier 2 has **no badge**.
**Tier 2 approval activates the marketplace account.**
`factory_images` is the one field that naturally takes multiple files.

### Engineer

| # | tierKey | routeSlug | Label | Behavior | Requires |
| --- | --- | --- | --- | --- | --- |
| 1 | `basic_engineer` | `basic_engineer` | Basic Engineer | `none` | — |
| 2 | `verified_engineer` | `verified-engineer` | Verified Engineer | `review_required` | text: `identityDocumentNumber` · docs: `identity_document` |
| 3 | `premium_engineer` | `premium-engineer` | Premium Engineer | `admin_only` | — |

Prereqs: 3 needs 2 approved. Badges: `Verified Engineer`, `Premium Engineer`.

> Auto-granted tier slugs are snake_case (`basic_oem`); every submittable tier
> slug is kebab-case (`registered-manufacturer`). Not a typo — matches the server.

---

## 5. Status lifecycle

```
draft_submission → submitted → under_review → approved
                                           └→ rejected
```

`KycSubmission.status` is the raw value. Admin list/detail rows carry a
pre-formatted label instead:

| status | admin label |
| --- | --- |
| `draft_submission` | Draft |
| `submitted` | Pending |
| `under_review` | Under review |
| `approved` | Approved |
| `rejected` | Rejected |

`submitted` and `under_review` both mean "awaiting admin" — treat them the same
in submitter UI. `useMyKycQuery` polls every 15s while either is present.

**One active submission per tier.** `draft_submission`, `submitted`,
`under_review`, and `approved` all block a resubmission for that tier
(`ACTIVE_KYC_SUBMISSION_STATUSES`). Only `rejected` frees the tier for a retry —
so the "resubmit" CTA is valid *only* after a rejection. Show `rejectionReason`.

On approval the server recomputes the user's `kycLevel` to the **highest-ordinal
approved tier label** for their role.

---

## 6. UI state model & edge cases

Five raw statuses collapse into **five UI states**. Copy this model — it is
implemented in full in `components/kyc/buyer-kyc-view.tsx`.

| UI state | From | CTA | Notes |
| --- | --- | --- | --- |
| `held` | `submissionBehavior: "none"` | none | Auto-granted. No submission exists — show account details, not an empty table. |
| `available` | no submission | **Upgrade** | Only for `review_required`. |
| `pending` | `submitted` · `under_review` · `draft_submission` | **none** | All three block resubmission. Differ by label only. |
| `approved` | `approved` | none | Badge earned. |
| `rejected` | `rejected` | **Resubmit** | The only state that permits a retry. |

**The CTA appears in exactly two states: `available` and `rejected`.** Showing
it during `pending` guarantees a 400 — `ensureNoActiveSubmissionExists` blocks
`draft_submission`, `submitted`, `under_review`, *and* `approved`.

`admin_only` tiers (Premium *) never get a CTA in any state.

### Rejection lifecycle

The path most likely to be got wrong. On
`PATCH /kyc/admin/tiers/:tierKey/reject`, the server (`service.ts:695`):

- **Mutates the submission in place** — `status → rejected`, stores
  `rejectionReason`, `reviewedBy`, `reviewedAt`. No new record.
- **Keeps the uploaded documents.** Nothing is removed from Cloudinary, so the
  buyer can still see what they sent. Keep rendering the document table.
- **Does not touch `kycLevel`.** `refreshUserRecognitionProjection` runs on
  approve and admin-grant only — a rejected *higher* tier never costs the user
  a tier they already hold.

Admin-side guards (surface these errors verbatim): only `submitted` /
`under_review` can be rejected, only `review_required` tiers, reason must be
non-empty after trim, and `submissionId` must belong to the route's `tierKey`.

**On resubmit a brand-new submission is created** — the rejected one persists
alongside it. So:

> ⚠️ Always resolve a tier's submission as **latest by `createdAt`**, not
> `.find()`. A first-match lookup keeps showing the old rejection after a
> successful retry. See `latestSubmissionFor`.

Every required document must be re-uploaded on a retry, even if only one was
the problem — `validateSubmissionPayload` enforces the full set each time.
There is no partial-fix path; don't build UI implying one.

**KYC decisions emit no notifications.** No email, no event, no in-app notice,
on approve *or* reject. The user only finds out by opening the page. That is
why `useMyKycQuery` polls every 15s while a submission is awaiting review —
don't remove the poll, and don't write copy promising "we'll email you".

### Edge cases to build for

| Case | Expected handling |
| --- | --- |
| Query loading | Skeletons matching final layout, not a spinner block. |
| Query error | Message + **Try again** calling `refetch()`. |
| No token | Hooks self-disable via `enabled` — render nothing rather than an error. |
| Unknown `[tier]` slug | "Tier not found" + link back. Don't 404 the route. |
| File > 5MB / wrong MIME | Catch **at selection**, before submit. |
| Missing required document | Block submit, name the field via its `label`. |
| Submit in flight | Disable button, spinner, **block dialog dismissal** — closing orphans a multipart upload. |
| Server validation error | Surface `Error.message` verbatim; it is already user-readable. |
| Active submission exists | Shouldn't be reachable if the CTA is gated correctly — still handle it. |
| Prerequisite unapproved | Gate the CTA and **name the blocking tier**. (N/A for buyer.) |
| Every tier approved | Hide "Upgrade" — don't leave it linking nowhere. |
| Approval lands while viewing | Poll picks it up; refresh the auth profile so the global badge updates. |
| `badgeLabel` is `null` | Registered Distributor / Registered Manufacturer have none by design. |

### Display copy overrides

Where a design's wording differs from the server's `tierLabel` /
`processingTime`, use a presentation-only override map keyed by `tierKey`
(see `BUYER_TIER_COPY`) — never change what is sent to the API. Known drift:

| tierKey | Server | Design |
| --- | --- | --- |
| `verified_business_buyer` | `Verified Business Buyer` / `Manual review` | `Business Buyer` / `Processing time 24-48 hours` |
| `verified_distributor` | `Manual review` | `Processing time 24-48 hours` |

⚠️ The buyer then sees different wording than the admin reviewing them. Worth
reconciling server-side rather than accumulating overrides.

---

## 7. Admin queue

`components/kyc/admin-kyc-management.tsx` + `admin-kyc-review-drawer.tsx` +
`admin-kyc-premium-grant.tsx`.

**The queue is submission-scoped.** `GET /kyc/admin/submissions` lists
submissions, not users — someone who never submitted has no row. It is a list
of things to review, not a roster.

> **Decided: there is no "Not started" row.** Early designs showed one. It
> would require listing users and cross-referencing submissions, which this
> endpoint cannot do. Don't re-add it.

### Allowed transitions

The drawer mirrors the server so no action can 400:

| Action | Legal from | Also requires |
| --- | --- | --- |
| Mark under review | `submitted` **only** | `review_required` tier. Not idempotent — a second call errors, so hide the button once `under_review`. |
| Approve | `submitted` · `under_review` | `review_required` tier |
| Reject | `submitted` · `under_review` | non-empty reason, `submissionId` matching the route `tierKey` |

`approved` and `rejected` are terminal — render read-only with the reviewer and
reason. Full rejection semantics in §6.

### Granting premium (`admin_only`) tiers

Premium tiers have **no user application path at all**. The only way one is
awarded is `PATCH /kyc/admin/tiers/:tierKey/approve` with a **`userId`** in
place of `submissionId`. The server synthesises an approved submission and
recomputes `kycLevel`. It rejects the call when: the tier isn't `admin_only`,
the `prerequisiteTierKey` isn't approved for that user, or the tier is already
approved. Buyer has no `admin_only` tier.

### Known contract gaps

Things the admin UI cannot do properly because the API doesn't support them.
Don't "fix" these in the frontend — they need server work.

| Gap | Detail |
| --- | --- |
| No name/email search | `AdminKycListFiltersDto` has only `status`, `kycLevel`, `userCategory`, `date`. The User name box filters **client-side over loaded rows** — it silently becomes wrong once pagination exists. |
| No pagination | `fetchAdminSubmissions` runs `.find(query)` with no limit and returns every submission ever. `useAdminKycListQuery` already normalises both array and paginated envelopes for when it lands. |
| No bulk actions | No bulk endpoint, so no select-column. Don't ship checkboxes that do nothing. |
| "Total Users" isn't a KYC stat | Sourced from `/admin/platform-users-summary` → `approvedUsers.total`, which counts *approved* users, not all registered. |
| "Under Review" over-counts | `pendingKycReviews` counts `submitted` **+** `under_review` together. |
| `verificationFlagged` is dead | Hardcoded `0` server-side. Not rendered. |
| No notifications | KYC decisions emit nothing — see §6. |

Tier is shown as an **ordinal**, resolved from the row's `kycLevel` (a tier
*label*) via `ALL_KYC_TIERS`. Don't parse the label string.

---

## 8. Hooks

```ts
import {
  useMyKycQuery,              // { tiers, submissions } — polls while pending
  useAdminKycListQuery,       // review queue, envelope normalised
  useAdminKycStatsQuery,      // summary cards
  useAdminKycDetailQuery,     // drawer detail
  useAdminKycTiersQuery,      // full catalogue, all roles
  useCreateKycSubmissionMutation,
  useMarkKycUnderReviewMutation,
  useApproveKycMutation,      // { tierKey, submissionId? , userId? }
  useRejectKycMutation,       // { tierKey, submissionId, rejectionReason }
} from "@/hooks/queries/kyc";
```

Approve takes `submissionId` for a review-required tier, or `userId` to grant an
`admin_only` (Premium) tier where no submission exists. All mutations invalidate
`queryKeys.kyc.all`.

---

## 9. Building a role's UI

1. Start from `components/kyc/buyer-kyc-view.tsx` — it already implements the
   state model and every edge case in §6.
2. Read tiers from `useMyKycQuery()` — never hardcode. Use
   `constants/kycTiers.ts` only for slugs/static params.
3. Collapse statuses into the five UI states (§6). Gate the CTA to `available`
   and `rejected` only.
4. Resolve each tier's submission as **latest by `createdAt`**.
5. Gate on `prerequisiteTierKey` being approved; name the blocking tier.
6. Build the form from `requiredTextFields` and `requiredDocuments`. Field names
   must match exactly — they are the wire format.
7. Pass `File` objects straight to `useCreateKycSubmissionMutation`. No pre-upload.
8. Enforce the upload constraints client-side for a better error than a 400.
9. Walk the edge-case table in §6 before calling a role done.

Fields render as `"text"` unless the UI opts into `"dropdown"` (country, state,
ID type). That's a **frontend-only** override — everything is sent as a plain
string either way, so no server change is needed.

---

## 10. Status

Contract layer — done:

- `types/kyc.ts` — matches server (adds `under_review`, `admin_only`,
  `prerequisiteTierKey`, `minimumCount`, nullable `badgeLabel`, upload constants).
- `constants/kycTiers.ts` — static catalogue mirror.
- `services/kycService.ts` — multipart submit, tier-based approve/reject,
  under-review, admin tiers, filters. Dead `/kyc/upload` removed.
- `hooks/queries/kyc.ts` — signatures updated, two hooks added.
- Orphaned `app/dashboard/oem/kyc-verification/kyc-data.ts` deleted.

Per-role UI:

- [x] **Buyer** — `buyer-kyc-view.tsx`. All five states, full edge-case pass.
      Reference implementation.
- [x] **Distributor** — `distributor-kyc-view.tsx`. Rewritten against §6; adds a
      sixth UI state, `locked`, for an unmet `prerequisiteTierKey` and for
      un-awarded `admin_only` tiers. Tier 2 collects `countryOfOrigin` in an
      inline panel and the rest in the dialog — still one multipart request.
      Dropdown options live in `constants/kycFieldOptions.ts`.
- [x] **Admin** — `admin-kyc-management.tsx` (queue), `admin-kyc-review-drawer.tsx`
      (approve / reject / mark-under-review), `admin-kyc-premium-grant.tsx`
      (`admin_only` grants by `userId`). Transitions and gaps in §7.
- [x] **OEM** — `oem-kyc-view.tsx`. Four tiers, `locked` state for the admin-only
      Premium tier. Adds per-requirement **multi-file** upload (`factory_images`,
      `supporting_document`, capped at 5 each and 10 per request) with a
      removable file list. Tier 3 correctly has no prerequisite.
      ⚠️ The designs show a **work email verification + OTP** step on tier 2.
      No such field or endpoint exists server-side, so it is not rendered — add
      it to `baiy-server/src/features/kyc/config.ts` first. The designs also
      show a `website` field on tier 2 (not a server field, omitted) and a
      *video* upload on tier 3 (video MIME types aren't in the server's allow
      list, so it folds into `supporting_document`).
- [x] **Engineer** — `engineer-kyc-view.tsx`. Three tiers, `locked` state for the
      admin-only Premium tier. Detail page uses a two-column split (tier summary
      / uploaded documents) per the designs. ⚠️ The designs show a **fourth**
      tier, "Certified Engineer" (OEM training certificates, multi-file) — no
      such tier exists server-side, so it is not rendered. Add the tier to
      `baiy-server/src/features/kyc/config.ts` and `constants/kycTiers.ts`
      before building it. The designs also show a government-ID *type* dropdown
      on tier 2 that the server doesn't require for engineers; omitted.

All four roles now have their own view. The legacy shared
`submitter-kyc-view.tsx` has been deleted.
