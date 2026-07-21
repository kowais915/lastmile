# Last Mile

<p align="center">
  <strong>Turn a time-sensitive food donation into a transparent, completed handoff.</strong><br />
  Operations software for food-rescue coordinators, community partners, and volunteers.
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://cdn.simpleicons.org/nextdotjs/000000" alt="Next.js" width="32" height="32" /></a>&nbsp;
  <a href="https://react.dev"><img src="https://cdn.simpleicons.org/react/61DAFB" alt="React" width="32" height="32" /></a>&nbsp;
  <a href="https://www.typescriptlang.org"><img src="https://cdn.simpleicons.org/typescript/3178C6" alt="TypeScript" width="32" height="32" /></a>&nbsp;
  <a href="https://tailwindcss.com"><img src="https://cdn.simpleicons.org/tailwindcss/06B6D4" alt="Tailwind CSS" width="32" height="32" /></a>&nbsp;
  <a href="https://clerk.com"><img src="https://cdn.simpleicons.org/clerk/6C47FF" alt="Clerk" width="32" height="32" /></a>&nbsp;
  <a href="https://neon.com"><img src="https://cdn.simpleicons.org/neon/00E699" alt="Neon" width="32" height="32" /></a>&nbsp;
  <a href="https://www.postgresql.org"><img src="https://cdn.simpleicons.org/postgresql/4169E1" alt="PostgreSQL" width="32" height="32" /></a>&nbsp;
  <a href="https://vercel.com"><img src="https://cdn.simpleicons.org/vercel/000000" alt="Vercel" width="32" height="32" /></a>&nbsp;
  <a href="https://openai.com"><img src="https://cdn.simpleicons.org/openai/412991" alt="OpenAI" width="32" height="32" /></a>
</p>

Built for **OpenAI Build Week 2026** in the **Work & Productivity** category.

## The problem

Food-rescue teams make urgent, high-consequence choices with fragmented information: food expires, partner capacity changes, collection windows close, and volunteers need a clear next action. A donation directory records supply; it does not coordinate the handoff.

Last Mile is a role-aware rescue workspace that moves a donation from public listing to reviewed allocation to volunteer-confirmed delivery—while preserving the reasons behind every decision.

## What is working

| Actor | Purpose | Product surface |
| --- | --- | --- |
| Donor | List surplus food without creating an account. | `/donate` |
| Coordinator | Creates a rescue workspace, invites the team, reviews donations, confirms allocation plans, and dispatches handoffs. | `/coordinator`, `/review`, `/team` |
| Partner manager | Keeps their organization’s capacity, dietary fit, urgency, and availability current. | `/partner` |
| Volunteer | Claims pickup tasks and records collection/delivery progress. | `/volunteer` |

```mermaid
flowchart LR
  D["Donor listing"] --> R["Coordinator review"]
  R --> A["Explainable allocation plan"]
  A --> C["Coordinator confirms"]
  C --> V["Volunteer claims pickup"]
  V --> H["Collected → delivered handoff"]
  P["Partner capacity & urgency"] --> A
```

### Core capabilities

- Public donation intake with collection windows, expiry, portions, dietary tags, and contact details.
- Coordinator review queue that turns an approved submission into a draft allocation plan.
- Deterministic, explainable allocation based on expiry risk, dietary fit, partner capacity, urgency, and fair access.
- Explicit confirmation before pickup tasks are dispatched.
- Role-specific workspaces protected by Clerk organization membership and Last Mile role records.
- Coordinator invitations that assign either a partner manager (and their partner) or a volunteer before they enter the workspace.
- Volunteer claim, collection, and delivery lifecycle with an audit trail.
- Tenant-scoped Neon Postgres data so each rescue organization sees only its own operations.

The data model and allocation rationale are documented in [docs/blueprint.md](docs/blueprint.md).

## Why this fits OpenAI Build Week

Last Mile is designed to demonstrate the four judging dimensions directly:

| Criterion | Evidence in Last Mile |
| --- | --- |
| Technological implementation | A working Next.js application with Clerk-authenticated organizations, Neon operational data, role gates, server-side actions, and an end-to-end dispatch workflow. |
| Design | Each actor lands in a focused workspace with only the next decision or action they need to make. |
| Potential impact | It targets a concrete operational failure: safe food goes to waste when expiring supply cannot be matched and collected in time. |
| Quality of idea | It treats fairness and allocation rationale as operational data—not opaque output—so rescue teams can explain and audit every handoff. |

### How Codex and GPT-5.6 were used

This is a Codex-built project. GPT-5.6 in Codex was used throughout the implementation to shape the role model and onboarding flow, build the Next.js/Clerk/Neon integration, design the database and allocation workflow, diagnose production-schema issues, and iterate on the role-specific user experience.

There is **no runtime OpenAI API dependency**: the value to the end user comes from deterministic, inspectable operational logic. That is intentional—coordinators must be able to understand why food was allocated, even under time pressure.

## Tech stack

- [Next.js 16](https://nextjs.org) + [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) for the application.
- [Tailwind CSS](https://tailwindcss.com) for the interface.
- [Clerk](https://clerk.com) for sign-in, organization membership, invitations, and active-workspace context.
- [Neon](https://neon.com) + [PostgreSQL](https://www.postgresql.org) for serverless, tenant-scoped operational data.
- [Vercel](https://vercel.com) for deployment.
- [Codex and GPT-5.6](https://openai.com) for the build process.

## Run locally

### Prerequisites

- Node.js 20 or later
- pnpm
- A Neon Postgres database
- A Clerk application with Organizations enabled

### Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Do not run the development server with `sudo`; Next.js writes local build files that should remain owned by your user.

Set these values in `.env.local` before starting the app:

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon’s pooled Postgres connection string; server-only. |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical application URL, without a trailing slash. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk browser key. |
| `CLERK_SECRET_KEY` | Yes | Clerk server key; never expose it to the browser. |

Apply [src/db/schema.sql](src/db/schema.sql) to a new Neon database or branch before using the application. For an existing database, apply only the migrations that have not already been applied—do not replay `CREATE TYPE`, `CREATE TABLE`, or `ALTER TABLE` statements blindly against production.

### Quality checks

```bash
pnpm lint
pnpm build
```

## Judge walkthrough

1. Sign up and choose **I coordinate food rescue** to create a rescue workspace.
2. From **Team**, invite a partner manager and/or volunteer. The coordinator assigns the Last Mile role; invitees should choose the invited-team path and accept the invitation.
3. As a partner manager, update capacity, urgency, dietary needs, and availability.
4. Submit a public donation at `/donate`.
5. As coordinator, review and approve it at `/review`, then confirm the allocation plan from `/coordinator`.
6. As a volunteer, claim the dispatched pickup and move it through collected and delivered.

This sequence demonstrates the product’s complete operational loop instead of isolated screens.

## OpenAI Build Week submission checklist

- [ ] Select **Work & Productivity** in Devpost.
- [ ] Add the repository URL and deployment/testing instructions.
- [ ] Upload a public YouTube demo under three minutes.
- [ ] In the voiceover, explain what Last Mile does and how Codex and GPT-5.6 were used.
- [ ] Retrieve the primary Codex `/feedback` session ID and add it to the Devpost form.
- [ ] If the repository is private, share it with `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] Add all team members, ensure they accept invitations, and submit the entry (not as a draft).

The official rules list the submission deadline as **July 21, 2026 at 5:00 PM PT**. Verify the current Devpost submission state before relying on this checklist.

## Development principles

- Enforce workspace scoping on every data access path.
- Keep allocation explanations as first-class data, not generated UI copy.
- Prefer deterministic and testable matching over opaque decisions.
- Never commit secrets, real donor/partner data, or volunteer credentials.
