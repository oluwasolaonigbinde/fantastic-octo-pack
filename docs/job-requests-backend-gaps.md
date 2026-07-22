# Job Requests (Engineer) — Backend Gaps

Screen: `/dashboard/engineer/job-requests`
Component: `app/dashboard/engineer/_components/engineer-job-requests-content.tsx`
Date: 2026-07-20

The UI has been rebuilt to the Figma design and is mobile responsive. The items
below are blocked on backend work — the frontend cannot resolve them alone.

---

## 1. Engineer cannot mark a job "Completed"

**Design says:** the Update Job Status modal has a **"Mark as Completed"** button.

**Backend supports:** engineer moves the job to `in_progress` via
`PATCH /service-requests/:id/status`. Only the buyer can complete it, via a
separate `PATCH /service-requests/:id/buyer-complete`.

**Current state:** button is labelled **"Mark as In Progress"** so it matches
what the API actually does.

**Decision needed:** either
- (a) backend allows the engineer to set `status: "completed"` on
  `PATCH /:id/status`, and we relabel the button; or
- (b) the design is wrong and the buyer keeps sole completion rights.

---

## 2. Price / unit price never captured

`UpdateServiceRequestStatusPayload` accepts `price` and `unitPrice`, and
`ServiceRequestData` returns both — but **no engineer UI reads or writes
either**. The field round-trips through the API and is never populated.

`e2e/slices/slice-07-service-request-and-engineer-job-flow.spec.ts:823` already
fails on this: it fills `input[placeholder="Price (optional)"]`, which does not
exist anywhere in `app/`. This test was broken before the UI rewrite.

**Decision needed:** is pricing part of the engineer flow? If yes, where does it
belong — on Accept, or on the status-update modal?

---

## 3. Filtering and counts are client-side only

`fetchServiceRequests` supports `page`, `limit`, and `status`, but every call
site passes `{}`. Consequences:

- the entire request list downloads on every page load (no pagination);
- the **Job type** and **Date** filters only match records that happened to
  arrive in that payload.

Fine at current volume. Will not hold as request counts grow.

**Ask backend for:** server-side filtering on `jobType` and `preferredDate`,
plus confirmation that `page`/`limit` are honoured.

---

## 4. `statusCounts` is incomplete

Two separate issues with the metric cards / tabs:

- `ServiceRequestStatusCounts` only has `total`, `pending`, `completed`,
  `rejected`. There is no `accepted` or `in_progress`, so those tabs cannot
  show counts.
- When the API returns `data` as a plain array (not the paginated shape), the
  fallback in `services/serviceRequestService.ts:76` synthesizes pagination but
  **omits `statusCounts` entirely** — so the metric cards silently fall back to
  counting only the local page.

**Ask backend for:** `accepted` and `in_progress` added to `statusCounts`, and
`statusCounts` present on every list response shape.

---

## For the client

Plain-language version of the above:

1. **The "Mark as Completed" button in the design doesn't match how the system
   works.** Right now only the buyer can mark a job complete — the engineer
   moves it to "In Progress" and the buyer confirms. We've labelled the button
   accordingly. If engineers should be able to close jobs themselves, that's a
   backend change and we need a decision.

2. **There's no way for an engineer to enter a price.** The system has a place
   to store one, but no screen asks for it. Confirm whether pricing belongs in
   this flow.

3. **Filters and counts are approximate on large volumes.** The Job type and
   Date filters currently search only the requests already loaded on screen.
   Needs server-side filtering before request volume grows.

---

## Verification status

Types (`tsc --noEmit`) and lint pass. The rebuilt screen has **not** been
rendered in a browser — responsive breakpoints are reasoned, not observed.
Check at 375px before merging.
