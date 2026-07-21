# Last Mile — Product & Engineering Blueprint

## One-sentence promise

Give food-rescue coordinators an explainable, fair plan for getting perishable donations to the right community partners before they expire.

## Primary users

| User | Job to be done | Core capability |
| --- | --- | --- |
| Coordinator | Prevent donated food from expiring while serving urgent needs fairly. | Create donations, review allocation plans, dispatch pickups. |
| Community partner | Communicate current need and realistic receiving capacity. | Maintain availability and accept allocations. |
| Volunteer | Complete a pickup with minimal friction. | Claim a task and record the handoff. |

## MVP journey

1. A coordinator logs a donation: 180 prepared meals, 48 portions vegan, expires in two hours.
2. Partners have open needs with capacity, dietary requirements, urgency, and collection windows.
3. The matching service proposes allocations and a plain-language explanation for each one.
4. The coordinator confirms the plan; pickup tasks are created.
5. A volunteer claims and completes a task; impact metrics and the audit record update.

## Allocation policy

The engine is deterministic, inspectable, and testable. It scores viable donation-partner pairs only after hard constraints are met.

**Hard constraints**

- The partner can receive before the donation expires.
- The partner has enough remaining capacity.
- The donated food is compatible with dietary requirements.
- The pickup falls inside both parties’ operating windows.

**Priority score**

`expiry risk + urgency + dietary fit + capacity fit + under-service fairness - travel-band cost`

Every recommendation records the score inputs and a human-readable explanation. A coordinator can always override a recommendation, and the override reason is recorded.

## Domain model

```text
Organization
 ├─ Membership (Clerk user + role)
 ├─ Partner
 │   └─ Need
 ├─ Donation
 │   └─ Donation item
 ├─ Allocation plan
 │   └─ Allocation
 │       └─ Pickup task
 └─ Audit event
```

All data is organization-scoped. The database schema will include organization IDs on every tenant-owned record and enforce foreign-key relationships.

## Architecture

```text
Next.js App Router
 ├─ Server components: read dashboards and reports
 ├─ Server actions: coordinator, partner, and pickup mutations
 ├─ Matching service: pure TypeScript policy module + tests
 └─ Data access: lazy, server-only Neon client

Neon Postgres
 ├─ Main branch: production data
 └─ Preview branches: isolated schema/data verification for Vercel previews

Clerk
 └─ Authentication, organization membership, and roles
```

## Security and reliability guardrails

- Database credentials are server-only and live in ignored environment files or Vercel encrypted variables.
- Clerk claims are verified server-side; client-provided organization IDs are never trusted.
- Coordinator actions are written to an immutable audit log.
- Allocation generation is idempotent for an input snapshot.
- The UI exposes loading, empty, and error states for every operational screen.
- Schema changes are tested in a Neon branch before being applied to main.

## Delivery milestones

1. Foundation: repository, Neon project, environment template, this blueprint.
2. Data layer: schema, migration, seed data, tenant-aware access layer.
3. Matching: deterministic allocation service with unit tests and explanations.
4. Operations UI: coordinator dashboard, partner needs, allocation review, pickup confirmation.
5. Auth & deploy: Clerk roles, Vercel environment variables, production deployment.
6. Submission: README completion, demo script/video, `/feedback` session ID, Devpost entry.

## Acceptance criteria for the demo

- A coordinator can add a donation that expires today.
- At least three partners have competing needs.
- The system visibly explains why each allocation was chosen.
- A volunteer can claim and complete a pickup.
- Dashboard metrics update: meals at risk, meals allocated, households served, and completed handoffs.
