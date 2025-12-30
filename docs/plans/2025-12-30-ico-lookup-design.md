# ICO Lookup for Billing (RPO)

## Context
The portal needs an ICO lookup so company onboarding and worker billing can auto-fill
billing data by entering an ICO and clicking a button. The lookup must be free and
use an official Slovak registry. Data must remain editable by the user.

## Goals
- Provide a server-side lookup endpoint that queries RPO and normalizes results.
- Auto-fill billing fields for both companies and workers (trade license).
- Add DIC and IC DPH fields to support invoicing.
- Keep UX simple: input ICO + "Load data" button, editable fields.

## Non-goals
- No paid data providers (e.g., FinStat).
- No bulk/batch imports or background sync.
- No automatic form submission after lookup.

## Data source
- RPO (Register pravnickych osob) for Slovak entities.
- Query by ICO; handle not-found and upstream failures gracefully.

## API design
- New route: `POST /api/registry/ico-lookup`
- Request: `{ ico: string }`
- Response (200):
  `{ name, street, city, zip, dic, icDph }`
- Errors:
  - 400 invalid ICO
  - 404 not found
  - 502 upstream failure

## Mapping rules
- Normalize registry response to a single payload for the UI.
- Keep output fields optional if upstream omits them.
- Use ASCII field names in API payload to avoid UI changes.

## UI changes
- Company onboarding form:
  - Add fields: DIC, IC DPH
  - Add "Load data" button next to ICO
  - On success: populate companyName, addressStreet, addressCity, addressZip, DIC, IC DPH
- Worker billing form:
  - Add fields: DIC, IC DPH
  - Add "Load data" button next to ICO
  - On success: populate billingName, billingStreet, billingZip, DIC, IC DPH
- Show loading state and error message; do not overwrite fields on failure.

## Validation and persistence
- Extend Zod validators:
  - ICO: 8 digits
  - DIC, IC DPH: optional string with light format checks
- Update Prisma schema to store DIC/IC DPH for company profile and worker billing.
- Update services to read/write the new fields.

## Security and rate limiting
- Require authenticated session for the lookup endpoint.
- Apply existing rate-limit utility to prevent abuse.
- Log upstream errors for debugging.

## Testing
- Unit tests for response mapping.
- API route tests:
  - valid ICO
  - invalid ICO
  - not found
  - upstream error

## Rollout
- Add feature to company onboarding and worker billing pages.
- Deploy migration, then enable UI.
