# Slice Playwright Specs

- Keep `core` intentionally small and curated. Do not add slice coverage to `e2e/core` by default.
- Create slice specs only from the real executable backlog in `docs/06_slice_plan.md`.
- Name files `slice-<two-digit-id>-<slug-from-backlog-title>.spec.ts`.
- New slice scaffolds must include the `TODO_SLICE_IMPLEMENTATION` marker until `/build-active-slice` replaces it with the frozen flow assertions.
- MCP can help with exploration, selector discovery, and debugging, but review and closure rely on committed slice specs plus verification evidence in the contract.
- For authenticated slice coverage, refresh role auth states with `npm run test:e2e:auth:refresh` and import the matching fixture from `e2e/auth/fixtures.ts`.
- Local workflow details live in `docs/LOCAL_ROLE_PLAYWRIGHT_AUTH.md`.
