# Job Requests (Engineer) — Backend Gaps

Screen: `/dashboard/engineer/job-requests`
Component: `app/dashboard/engineer/_components/engineer-job-requests-content.tsx`
Date: 2026-07-20 (revised 2026-07-30)

The UI has been rebuilt to the Figma design and is mobile responsive. The items
below are blocked on backend work — the frontend cannot resolve them alone.

---

## 1. Engineer cannot mark a job "Completed" — RESOLVED

Backend added a `work_completed` status (server commit `bab3c46`). The
transition chain is now:

```
pending → accepted → in_progress → work_completed → completed
          (engineer, PATCH /:id/status)              (buyer, PATCH /:id/buyer-complete)
```

**Frontend now does:**
- Engineer's Update Job Status modal offers **"Mark as In Progress"** from
  `accepted` and **"Mark as Completed"** from `in_progress`. Both go through
  `PATCH /:id/status`; the target is derived by `getNextEngineerStatus`.
- Buyer's **"Confirm completion"** button is gated on `work_completed`, not
  `in_progress`. This was a live bug: the button rendered on `in_progress`,
  where `PATCH /:id/buyer-complete` rejects with
  *"Only work-completed service requests can be confirmed by the buyer"*.
- `work_completed` renders as "Awaiting your confirmation" (buyer) /
  "Awaiting buyer confirmation" (engineer), and counts as ongoing everywhere
  an accepted/in-progress request did.

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

Still open. `fetchServiceRequests` supports `page`, `limit`, and `status`, but
`ServiceRequestService.fetch` on the server takes only `(userId, role)` and
ignores every query param, and every call site passes `{}`. Consequences:

- the entire request list downloads on every page load (no pagination);
- the **Job type** and **Date** filters only match records that happened to
  arrive in that payload.

Fine at current volume. Will not hold as request counts grow.

**Ask backend for:** server-side filtering on `jobType` and `preferredDate`,
plus confirmation that `page`/`limit` are honoured.

---

## 4. `statusCounts` is incomplete — RESOLVED via a separate endpoint

`GET /service-requests` still returns a plain array with no `statusCounts`, so
the metric cards were counting only the locally loaded page.

Backend shipped `GET /service-requests/summary` instead (server commit
`aedd6b0`), role-scoped from the JWT and returning:

```jsonc
{ "total": 12, "active": 4, "disputeActive": 1,
  "byStatus": { "pending": 2, "accepted": 1, "in_progress": 1,
                "work_completed": 0, "completed": 7, "rejected": 1,
                "closed_after_dispute": 0 } }
```

`active` = pending + accepted + in_progress + work_completed.

**Frontend now does:** buyer and engineer metric cards read
`useServiceRequestSummaryQuery()` and fall back to counting the loaded page only
while the summary is in flight or errored. `ServiceRequestStatusCounts` on the
list response is now unused by the metric cards.

---

## For the client

Plain-language version of the above:

1. **Done.** The engineer can now mark a job as completed. The buyer then gets
   an "Awaiting your confirmation" request and confirms it (or raises a
   dispute) to close it out.

2. **There's no way for an engineer to enter a price.** The system has a place
   to store one, but no screen asks for it. Confirm whether pricing belongs in
   this flow.

3. **The metric cards are now exact.** They read the new summary endpoint
   rather than counting what happens to be on screen.

4. **Filters are still approximate on large volumes.** The Job type and Date
   filters search only the requests already loaded on screen. Needs
   server-side filtering before request volume grows.

---

## Verification status

Types (`tsc --noEmit`) and lint pass. The screens have **not** been rendered in
a browser and the completion handshake has **not** been exercised against a
running server — the transitions were read off
`src/features/service-request/status-transitions.ts`. Check at 375px and walk
one job through accept → in progress → completed → buyer confirm before
merging.
