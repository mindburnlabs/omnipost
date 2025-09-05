
# AGENTS.md — OmniPost
*A single, predictable brief for coding agents working on this repository.*  
Think of this file as the project's "README for agents." Keep it up to date.  
Reference: AGENTS.md is an open, markdown-only convention adopted by many tools.

---

## Mission (what to build & protect)
OmniPost is a calm, dependable system to **write once, publish everywhere** (Discord, Telegram, Whop), schedule with confidence, run A/B tests, and learn what works. It runs in **two modes**:
- **Whop-embedded app** (in-Whop iFrame; respects Whop access & billing).
- **Standalone SaaS** (own domain; own login & billing).
Your changes must **preserve feature parity** between both modes and keep UX "Apple-calm" (clear, focused, one obvious next step).

---

## Golden outcomes (acceptance at a glance)
A change is "good" when these hold true:
1) **Compose → Validate → Schedule → Publish** succeeds once (no duplicates), with stored platform IDs and clear logs.  
2) **Draft → Approval → Changes → Approve → Publish** feels calm and traceable.  
3) **A/B test** runs; **Promote winner** applies to future posts.  
4) **Failure** shows a **plain-English** reason and a one-click recovery that works.  
5) **Best Time** shows 2 daily suggestions and measurably improves engagement over time.  
6) **Whop**: embedded view opens without extra login; **Access: Granted/Limited** chip is accurate; upgrade flips access immediately.  
7) **SaaS**: a new user reaches their first scheduled post in ≤10 minutes without docs.  
8) **Demo data never leaks** to real workspaces; a **Data Purity: OK** badge remains green.

---

## Repository quick map
> If paths differ, update this map before proceeding.

/src/app # Next.js App Router (UI: Home, Composer, Calendar, Library, etc.)
/src/app/next_api # HTTP handlers, policy layer, webhooks
/src/lib # Shared utilities (auth, entitlement, logging, time, analytics)
/src/components # UI components (cards, lists, dialogs, toasts)
/src/types # TypeScript type definitions
/public # Static assets (icons, manifest, PWA)

---

## Setup & common tasks (use these exact commands)
> Prefer **Node LTS (≥18/20)** and **pnpm**. Keep scripts idempotent.  
> If a script is missing, create it and add to this list.

- **Install**: `pnpm install`  
- **Dev (web + server)**: `pnpm dev`  
- **Build**: `pnpm build`  
- **Typecheck**: `pnpm typecheck`  
- **Lint & fix**: `pnpm lint && pnpm format`  
- **Unit/Integration tests**: `pnpm test`  
- **E2E smoke**: `pnpm test:e2e`  
- **Seed demo tenant only**: `pnpm demo:seed`  
- **Reset demo tenant only**: `pnpm demo:reset`  

**Never** invent new ad-hoc scripts; extend these.

---

## Modes & routing (what to keep true)
- **Whop-embedded**
  - Primary route renders inside Whop: `/experiences/[experienceId]`.
  - No parallel login. Rely on Whop's signed user context (access checks gate features).
  - In-app upgrade is native to Whop; UI updates immediately after billing events.
- **Standalone SaaS**
  - Same screens and UX. Own auth & billing flows. Custom domain capable.
- **Links & deep links**
  - Must work in both modes. Use stable paths and route params (`experienceId`).

---

## Environment & secrets (how to behave)
- Retrieve secrets from the **env vault** by name; **do not print secret values** in code, logs, diffs, or tests.
- Expected variables (names only; values in vault):  
  `OPENAI_API_KEY, ANTHROPIC_API_KEY, WHOP_API_KEY, NEXT_PUBLIC_WHOP_APP_ID, NEXT_PUBLIC_WHOP_AGENT_USER_ID, NEXT_PUBLIC_WHOP_COMPANY_ID, DISCORD_APP_ID, DISCORD_BOT_TOKEN, TELEGRAM_BOT_TOKEN, RESEND_API_KEY, STORAGE_* (ENDPOINT/REGION/BUCKET/ACCESS_KEY/SECRET_KEY), CDN_BASE_URL, OMNIPOST_WEBHOOK_SECRET, OMNIPOST_SIGNING_KEY, OMNIPOST_SCHEDULER_TZ, OMNIPOST_RATE_LIMITS, OMNIPOST_DEMO_MODE, OMNIPOST_DISABLE_GLOBAL_SEED, OMNIPOST_DATA_PURITY_ENFORCED`
- Mask secrets in UI (`aaaa…•••`), provide **Copy** buttons, and support **Regenerate** flows.

---

## Data purity & demo rules (do not break)
- **Only** the **demo workspace** may contain seeded/mocked content. Convention:
  - `workspaces.slug = "demo"`, `is_demo = true`, `whop_experience_id = "exp_demo"`.
- **Never** seed or insert "temp/mock/sample" data in non-demo workspaces.  
- Keep **Sandbox Publish Simulator** active in demo: generate fake platform IDs like `sand:discord:xyz`.
- CI must fail if runtime code contains hardcoded UUIDs or "temp/mock/sample/fixture" strings outside tests/migrations.
- Provide `/admin/demo/reset` & `/admin/demo/seed` owner-only for demo.

---

## Guardrails (things you must not do)
- Do **not** add a separate login when embedded in Whop.  
- Do **not** log, echo, or snapshot secrets or user tokens.  
- Do **not** bypass access checks (entitlements) before reading/writing workspace data.  
- Do **not** create mock data outside the demo workspace.  
- Do **not** relax publish idempotency (exactly-once) or remove retries/circuit breakers.  
- Do **not** change public routes or API shapes without updating docs and tests.

---

## UX invariants (keep the feel consistent)
- **Apple-calm**: spacious typography, clear hierarchy, one dominant action per screen.  
- **Three-pane Composer**: Destinations (left), Canonical editor (center), Live previews (right), with a sticky bottom bar (Best Time, A/B, Schedule/Publish, Preview, Save).  
- **Calendar**: drag-to-move, polite conflict hints, DST-safe.  
- **Approvals**: gentle diffs, respectful language, SLA cues, escalation.  
- **Analytics**: timing heatmap as hero, top posts, channel breakdown, export.  
- **Automation**: plain-language rules, **dry run** preview, run history.  
- **Failures**: human-readable reason + one most helpful action, right where the eye lands.

---

## Quality gates (run before you finish)
- **Tests pass**: unit + integration + E2E smoke (`pnpm test && pnpm test:e2e`).  
- **Data Purity**: demo-only seed confirmed; non-demo mock scan returns 0 violations.  
- **Golden paths** (see "Golden outcomes") verified via scripts or checklists.  
- **Accessibility**: keyboard navigation, focus states, contrast, screen-reader labels on new components.  
- **Docs**: update `README.md` (human), **this `AGENTS.md`** (agent), and any API or workflow docs you touched.

---

## Change policy (how to land a PR)
Include a short, human-readable **Change Summary** with:
- The user problem you solved.  
- Screens/flows affected.  
- Any plan limit or entitlement changes.  
- Proof of the golden paths and data-purity checks.  
- Screenshots or TTY casts for flows (Composer, Calendar, Approvals, Failure & Recovery).

Use **Conventional Commits** for messages (e.g., `feat: approvals SLA banner`).

---

## What to optimize first (if you are choosing work)
1) **Reliability** on publish (idempotency, retries, logs).  
2) **Composer quality chips** (links, media, mentions, duplicate risk).  
3) **Best Time** clarity (two suggestions surfaced across Home/Composer/Calendar).  
4) **Approvals** friction (fast decisions, clear diffs).  
5) **Failure Recovery** (one-click fix succeeds).  

Only then: net-new feature work.

---

## Useful test scenarios (create or run)
- **Repost Guard** catches near-duplicate text and image (pHash) and offers a rewrite.  
- **DST week** reschedule: no double-posting or skipped slot.  
- **Bad credential** produces a humane failure and "Reconnect" → retry success.  
- **A/B** winner auto-promotion; future posts inherit the winner.  
- **Inbound automation** "dry run" shows exactly what would happen, then runs cleanly.  
- **Whop limited** user → sees upgrade; after upgrade, access flips with no reload.

---

## Tooling tips (agents)
- Prefer small, **focused diffs** with clear commit messages.  
- When refactoring, mirror the existing **naming & file organization**; do not invent a new structure.  
- When adding deps, explain **why** and confirm no overlap with existing utilities.  
- Keep **performance** in mind: reduce bundle size and n+1 queries; avoid blocking work on the UI thread.  
- Write short, kind **error text** users can actually understand.

---

## Glossary
- **Workspace**: Tenant boundary for data, roles, and settings.  
- **Variant**: Platform-specific rendering of the canonical post.  
- **DLQ**: Dead-Letter Queue for failed publish jobs that need manual attention.  
- **Entitlement**: Access rights for a user within a Whop **experience** or SaaS plan.  
- **Best Time**: Suggested posting windows from observed engagement.  
- **Demo**: Isolated, safe tenant with simulated publishes.

---

## Keep this file current
Any change to setup, scripts, routes, data rules, or core UX requires updating **AGENTS.md**.  
If you are unsure, **stop and document**, then continue.
