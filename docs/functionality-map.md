# Functionality Map (High Level)

## Roles
- `WORKER`: onboarding, preferences, job feed, apply/cancel applications, notifications
- `COMPANY`: onboarding, create/update jobs, manage applications, exports (hours/bonuses), KPIs
- `ADMIN`: dashboard aggregates, approve companies

## Core Domain Flows

### Auth
- Credentials login via `src/config/auth.ts` (NextAuth)
- Registration via `src/app/api/auth/register/route.ts`

### Worker
- Onboarding: `src/app/api/worker/onboarding/route.ts` → `src/server/services/worker.ts#completeWorkerOnboarding`
- Preferences: `src/app/api/worker/prefs/route.ts` → `src/server/services/worker.ts#getWorkerPreferences` / `updateWorkerPreferences`
- Ready toggle: `src/app/api/worker/ready/route.ts` → `src/server/services/worker.ts#setWorkerReadyState`
- Job feed & details: `src/app/api/worker/jobs/route.ts` → `src/server/services/jobs/worker-feed.ts`
- Applications: `src/app/api/worker/applications/route.ts` → `src/server/services/applications/*`

### Company
- Onboarding: `src/app/api/company/onboarding/route.ts` → `src/server/services/company.ts#completeCompanyOnboarding`
- Job management: `src/app/api/company/jobs/route.ts`, `src/app/api/company/jobs/[id]/route.ts`
  - create/update jobs: `src/server/services/jobs/company.ts`
  - status transitions & cancellation cascade: `src/server/services/jobs/status.ts`
  - slots/policy/on-call pings: `src/server/services/jobs/capacity.ts`
- Application management: `src/app/api/company/applications/[id]/route.ts` → `src/server/services/applications/status.ts`
- Exports (CSV): `src/app/api/company/exports/*` → `src/server/services/exports.ts`
- KPIs: `src/server/services/company-kpis.ts`

### Notifications
- List + mark read: `src/app/api/notifications/*` → `src/server/services/notifications.ts`
- Domain events trigger notifications from jobs/applications services (e.g. apply/confirm/cancel)

## Validation (Zod)
- Auth: `src/lib/validators/auth.ts`
- Onboarding: `src/lib/validators/onboarding.ts`
- Jobs: `src/lib/validators/jobs.ts`, `src/lib/validators/job-management.ts`
- Applications: `src/lib/validators/applications.ts`
- Worker preferences: `src/lib/validators/worker-preferences.ts`
- Notifications: `src/lib/validators/notifications.ts`

## Test Targets (Recommended)
- Pure/domain logic: scoring, eligibility, KPI calculations, CSV formatting
- Service logic: state transitions, overlap prevention, min-rate enforcement, notice/urgency/bundle rules
- API routes: auth guards, validator failures, success payloads

