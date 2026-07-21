# Last Mile

Last Mile helps food-rescue teams allocate perishable donations before they expire. Rather than acting as a donation directory, it gives coordinators an explainable distribution plan based on expiry, dietary fit, partner capacity, urgency, and fair access.

Built for the **OpenAI Build Week 2026** — Work & Productivity track.

## The problem

Food-rescue organizations often receive time-sensitive donations while community partners have competing needs and limited collection capacity. Coordinators make high-stakes allocation decisions manually, which means usable food is lost and urgent households can go unserved.

## Product scope

- Record perishable food donations, expiry windows, and dietary constraints.
- Capture partner needs, capacity, operating hours, and urgency.
- Produce a transparent allocation plan that prioritizes food at risk and fair distribution.
- Let volunteers claim pickups and confirm handoffs.
- Preserve an auditable history of every allocation and delivery outcome.

The complete implementation blueprint is in [docs/blueprint.md](docs/blueprint.md).

## Technology

- Next.js 16, React 19, TypeScript, and Tailwind CSS
- Neon Postgres for operational data and isolated preview branches
- Clerk for authenticated organization workspaces and role-based access (to be configured)
- Vercel for deployment

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Set the required environment variables. Never commit `.env.local`.
4. Run `pnpm dev` and open `http://localhost:3000`.

Useful checks:

```bash
pnpm lint
pnpm build
```

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled Neon connection string; server-only. |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical application URL. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | After auth setup | Clerk browser key. |
| `CLERK_SECRET_KEY` | After auth setup | Clerk server key; never expose it to the browser. |

## OpenAI Build Week submission notes

The product has no runtime OpenAI API dependency. It is built with Codex and GPT-5.6, as permitted by the competition requirements. Before submission, this repository will include:

- setup instructions and demonstration data;
- a concrete account of where Codex and GPT-5.6 accelerated the build and informed decisions;
- the public deployment URL;
- a public, narrated demo video under three minutes;
- the primary Codex `/feedback` session ID.

## Development principles

- Use server-only database access and lazy client initialization.
- Enforce organization scoping on every data access path.
- Treat allocation explanations as first-class data, not generated UI copy.
- Keep matching deterministic and testable; no opaque model decision is required.
- Never commit secrets, production data, or volunteer/partner credentials.
