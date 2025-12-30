# Company Tests Design

## Goal
Deliver "tip-top" coverage of company functionality by combining stable E2E UI coverage with comprehensive service/API tests. Keep the suite fast enough for regular runs and reliable in CI.

## Scope
Company-facing features to cover:
- Auth + role gating (company only)
- Onboarding + approval gating
- Job create/edit (urgent, bundle, notice policy, slots)
- Job status transitions (open/full/cancel)
- Applications management (confirm/reject/cancel)
- Worked confirmations
- Contract template + company signing
- Exports (hours/bonuses) for range and single job
- Invoices list and invoice detail (company view)
- Company workers (history, priority, narrow collaboration)
- Narrow collaboration settings (groups/schemes/schedules)

Out of scope:
- Admin-only flows unless they directly gate company access (approval can be mocked via seed/admin API).

## Approach (Hybrid)
- Playwright: cover end-to-end UI for critical company flows (happy paths + key guardrails).
- Vitest: cover edge cases and domain/service logic that are slow or brittle in UI tests.

This balances realism (UI) with speed/stability (service/API).

## Playwright Coverage (E2E)
Planned UI scenarios:
1. Company login and role gating.
2. Company onboarding completion.
3. Job create (basic + urgent + bundle) and verify listing/preview.
4. Job edit (policy + slots + status transitions).
5. Applications: confirm/reject flows (seeded worker applies).
6. Worked confirmations flow after shift end (seeded time window).
7. Contract template create/update + company signature flow.
8. Export CSV endpoints from UI.
9. Company invoices list view.
10. Company workers view + relation toggles (priority / narrow collaboration group).
11. Narrow collaboration groups and schemes management UI.

Data strategy:
- Use seeded demo accounts and create new entities with unique titles in each test.
- Reuse authenticated storage state per role.

## Vitest Coverage (Service/API)
Targeted tests:
- Job status transitions and validation.
- Slots and policy updates.
- Notice window timing rules and compensation calculation.
- Wave gating (stage rules + auto wave transitions).
- Narrow collaboration scheduling (cutoff and range constraints).
- Contract signing rules and deadlines.
- Invoice validation (billing required, send timing).
- Export scopes (range/job) and CSV formatting.
- Company KPI calculations and edge cases.

## Execution
- E2E: `npx playwright test`
- Unit/service: `npm run test`

## Risks
- UI brittleness due to seed/state coupling. Mitigation: test data isolation and stable locators.
- Time-sensitive flows (worked confirmations) need controlled timestamps in tests or seeded shifts.

## Success Criteria
- All company UI flows are covered by at least one stable E2E test.
- Domain logic and edge cases are covered in Vitest with deterministic assertions.
- Test suite runs end-to-end without manual steps beyond DB seed and app startup.
