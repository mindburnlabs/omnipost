
# OmniPost
**Write once. Publish everywhere.**  
A calm, dependable workspace to compose, schedule, A/B test, and analyze posts across **Discord**, **Telegram**, and **Whop** — as a **standalone SaaS** on your domain *or* an **embedded Whop app**.

---

## ✨ Why OmniPost
- **Speed:** One draft → platform-perfect variants in minutes.
- **Safety:** Guardrails catch duplicates, broken links, and format limits *before* you publish.
- **Results:** Best-time scheduling, A/B tests, and clean analytics tell you what actually works.
- **Flexibility:** Runs **inside Whop** or **as your own SaaS** with full feature parity.

---

## 🧭 Product at a Glance
- **Home:** Today's queue, approvals, "best times", recent activity, tiny timing heatmap, connection health, and a persistent **New Post**.
- **Three-Pane Composer:** Destinations (left) • Canonical editor (center) • Live platform previews (right) with quality chips (links, media, mentions, duplicate risk). Bottom bar: Best Time • A/B • Schedule/Publish • Preview • Save Draft.
- **Calendar:** Clean week/month, drag-to-move, polite conflict flags, quick-edit cards, quiet hours per destination, holiday skips, no double-booking, DST-safe.
- **Library & Versioning:** Posts, Assets, Templates, Snippets; thumbnails, usage, alt text; saved views; bulk actions; post/version history with diffs & restore; duplicate-finder for assets.
- **Experiments:** A/B scorecards, clear winners, one-click promote.
- **Analytics:** Headline KPIs, **Timing Heatmap** (day×hour), top posts, channel breakdown, cohorts by tag/campaign, first-24h velocity, comparison views, attribution confidence hints.
- **Approvals:** Respectful review, gentle diffs, comments, SLAs, reminders, escalation.
- **Automation:** Plain-language rules ("When X, if Y, do Z"), dry-run mode, templates, run history; inbound (GitHub/RSS/Calendar) and outbound (Zapier/n8n/SIM).
- **Quality & Safety:** Repost Guard (text/image), broken links, ToS guardrails (length/media/limits), mention validation, URL allow/deny list.
- **Failures & Recovery:** Human-readable errors, Dead-Letter area, one-click retry, comprehensive logs, patient backoff; status & queue visibility.
- **Notifications:** In-app, email, optional Slack for approvals, publish success/failure, reconnect needed, A/B winner, quota nearing limit.
- **Settings:** Connections, Brand Kit, UTM profiles, Roles, Webhooks, API Tokens, Storage, Email sender, Billing/Plan, Backups & PITR, Timezone, Data Purity, Enterprise controls.
- **Modes:**  
  - **Whop-Embedded:** Compact layout, entitlement chip ("Access: Granted/Limited"), native billing/deep links, Whop Feed as a first-class destination.  
  - **Standalone SaaS:** Own domain, login/billing/team management, guided onboarding checklist, plans page, usage meters, receipts center, custom domain.

---

## 🔐 Identity & Security
- 2FA/MFA (standalone), SSO (Google + enterprise options), session management ("sign out all devices"), admin IP allowlist.
- Role-based access: **Owner, Admin, Publisher, Editor, Viewer, Approver**.
- Organization-level audit trail export, content safety checks, privacy-aware defaults.

---

## 🌍 Internationalization & Time
- Multi-timezone per workspace/destination, DST-safe scheduling.
- Optional multi-language content labels for analytics segmentation.
- UI language selection (labels and copy).

---

## 📈 Attribution & Links
- Built-in short links & UTM profiles; clicks/conversions tied to **exact variants**.
- Decision-ready rollups with transparent attribution confidence.

---

## 🧪 Demo Mode
A clearly marked **Demo** workspace with realistic sample content and simulated publishes that never touch real platforms. One-click **Reset/Reseed** and a visible **Data Purity: OK** badge.

---

## 🧩 Deployment Modes

### 1) Whop-Embedded
- Opens inside a Whop experience (native feel).
- Honors Whop entitlements and plans (upgrade in place).
- Optional posting to the Whop forum/feed.

### 2) Standalone SaaS
- Runs on your own domain with your own login, billing, and team management.
- Guided onboarding: connect channels → set Brand Kit → choose plan → create first post.

Feature parity is maintained across both modes.

---

## 🛠 Quick Start (human-readable)
1. **Create a workspace** and choose mode: *Whop* or *Standalone*.
2. **Connect platforms**: Discord, Telegram (and Whop feed if you want).
3. **Set Brand Kit**: tone, banned words, emoji policy, UTM profiles.
4. **Compose your first post**: watch live previews; fix anything the chips flag.
5. **Schedule** (pick a slot or choose **Best Time**).  
6. **Review & approve** if needed; publish with confidence.  
7. **See results** in Analytics; promote A/B winners with one click.
8. **Automate** repetitive flows with plain-language rules; test with **dry run** first.

> **Tip:** Use **Demo Mode** to explore safely—everything looks real, nothing leaves the sandbox.

---

## 🗂 Core Concepts
- **Workspace** → team, settings, and data boundary.  
- **Post** → one canonical message with **Variants** per platform.  
- **Schedule** → when each variant goes live (DST-safe).  
- **Experiment** → A/B test on hooks/CTAs/variants with clear winners.  
- **Rule** → plain-language automation (trigger → conditions → action).  
- **Asset** → images/files with alt text and perceptual hash for duplicate checks.

---

## 🛡 Reliability & Compliance
- Publish **exactly once** (idempotent), with safe retries and circuit breakers.
- Status panel: platform health, incidents, queue backlog, next retries; public status page link.
- Data retention controls (workspace level), privacy policy, DPA, cookie consent.
- Backups with **point-in-time recovery**; "last restore drill" visibly tracked.
- Roadmap toward SOC 2 readiness, vulnerability disclosure policy, periodic pen-tests.

---

## 🔔 Notifications (opt-in per user/workspace)
- Approvals needed, publish success/failure, reconnect required, A/B winner, quota limits.
- Channels: in-app, email, optional Slack.

---

## 🧑‍🤝‍🧑 Collaboration
- Approvals with comments, gentle diffs, SLAs and reminders, escalation to a backup approver.
- Version history with diffs and restore for posts and templates.

---

## 🧠 Intelligence
- **Best Time**: 2–3 recommendations daily per destination based on live engagement patterns.
- **Repost Guard**: blocks accidental repeats; offers fresh rewrites.
- **Smart Stylers**: platform-aware formatting/pacing so it "just looks right".

---

## 📤 Import / 📥 Export
- Bulk import (CSV/RSS) and full export (CSV/JSON) of posts, asset metadata, and analytics.
- Right-to-erasure and whole-workspace deletion flow.

---

## 🧰 Public API & Webhooks
- Read/write APIs for posts, schedules, and analytics snapshots.
- Inbound (create drafts, trigger actions) and outbound (publish, metrics, A/B winner) webhooks with simple schemas.

---

## 🖼 Design System
- "Apple-calm" visual language: spacious typography, clear hierarchy, one obvious next step per screen.
- Consistent header, left navigation, card patterns, toasts, and three-pane composer.
- WCAG-compliant focus states and keyboard-friendly interactions (⌘K palette, ⌘S save, Esc close, ⌘/ shortcuts).

---

## ✅ Go-Live Checklist
- Opens cleanly **inside Whop**; user recognized; **Access: Granted/Limited** chip accurate; upgrade flow flips access instantly.  
- **Standalone**: new user → first scheduled post in **≤10 minutes** without docs.  
- Five golden paths pass:  
  1) Compose → Validate → Schedule → Publish (IDs stored; no duplicates).  
  2) Draft → Approval → Changes → Approve → Publish.  
  3) A/B winner promoted → applied to future posts.  
  4) Failure explained in plain English → Reconnect/Retry succeeds.  
  5) Plan change reflects limits and usage meters right away.  
- Notifications land (in-app + email).  
- Analytics is decision-ready (heatmap + top posts + breakdown + export).  
- Backups restore drill completed recently and visible in Settings.  
- Demo Mode data never leaks; **Data Purity: OK** is green.

---

## 🗺 Roadmap Highlights
- Offline drafts & background sync
- Global "find anything" search
- Support-safe read-only view
- Abuse/flood protection for inbound automations
- Referrals/coupons (SaaS)
- Knowledge base & in-app "How-to" links

---

## 🤝 Contributing
We welcome issues, UX suggestions, and documentation improvements. Keep proposals **user-outcome-first** and **plain English**. For feature ideas, include: *who benefits, what they see, how it changes their day, and success criteria*.

---

## 🔒 Security
Please report vulnerabilities responsibly via the security contact listed in the app's **Settings → Trust & Safety**. We do not accept unsolicited penetration test reports without prior agreement.

---

## 📄 License
Commercial software. See `LICENSE` for details (or contact sales for enterprise licensing and custom terms).

---

## 📬 Support
- In-app **Help (?)** → quick tips and context links  
- Email support via the address in **Settings → Support**  
- Status & incidents: see **Settings → Status** (and the linked public status page)

---

**OmniPost — the quiet, reliable way to plan and publish posts that perform.**  
Whether you run it **inside Whop** or on your **own domain**, the experience is the same: clear, fast, and trustworthy.
