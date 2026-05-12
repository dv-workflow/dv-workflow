---
title: "Pre-announce Blog Draft — AI-Native Supply-Chain Guard"
status: DRAFT — awaiting TechLead review before publication
target-publish: 2026-05-13 (Day 1) — within 7-day marketing-currency window per TW1
length-target: 600-900 words
companion: ADR-0005, supply-chain-guard-proposal.md §10
---

# Blog Draft: Introducing dw-kit's AI-Native Supply-Chain Guard

> **Draft notes:** This is the pre-announce blog post per TW1 (claim narrative early; ship code v1.3.5 by 2026-05-19). TechLead to review tone, claims, and links before publication. Headline alternatives at bottom for AB consideration.

---

## Why we're shipping this in a week, not next quarter

Yesterday (2026-05-11), the npm ecosystem absorbed another self-propagating worm. We're not writing about that worm specifically — full incident triage and remediation guidance from the affected projects' security teams covers it. We're writing about what we learned trying to evaluate our own exposure to it, and what that exercise revealed about a gap in the AI-coding tooling landscape that we're filling on May 19.

**The gap:** every existing supply-chain security tool — Snyk, Socket.dev, OSV-scanner, GitHub Advanced Security — was designed assuming a human author edits the lockfile, reviews the diff, runs `npm install` deliberately. That assumption is no longer true on most of our teams. AI coding agents add dependencies dozens of times per day, often without surfacing the diff to a human, and they favor exactly the packages attackers target: trending, popular, broadly imported.

**What we're shipping:** dw-kit v1.3.5 introduces an AI-Native Supply-Chain Guard, wired into the Claude Code Edit-lockfile event boundary. When an AI agent (Claude Code, but the design generalizes) modifies a `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` file, the guard fires automatically — checking the new dependency set against an auto-synced snapshot of GitHub Security Advisories and OSV.dev, with telemetry tracking what the guard catches and what it lets through.

## What we deliberately chose NOT to build

We considered curating our own indicator-of-compromise (IoC) bundle. We rejected that — it's bus-factor work that doesn't scale, and a sophisticated attacker can read a curated list and avoid matching it. We're instead piping data from two upstreams that already have well-funded multi-maintainer teams owning data quality: GHSA and OSV.dev. dw-kit's contribution is the **workflow integration**, not the data.

We also considered making this a default-on feature for every dw-kit user. We rejected that too — solo developers using the `solo` preset rarely have CI infrastructure where this matters most, and forcing a hook on them is friction we don't want to impose. The guard ships opt-in OFF for `solo`, opt-in ON for `team` and `enterprise` presets.

## The public sunset commitment

This is the part we want to make load-bearing.

We are committing publicly, here, that on **2026-08-12** (90 days from ship), we will publish a review of this feature's telemetry. If by that date the guard has shown:

- **Zero verified real catches** of supply-chain advisories, OR
- **A false-positive rate exceeding 5%** across all scans

— then the feature is retired silently in dw-kit v1.4.x. We will publish the review results regardless of outcome. No "expanding to v2.0", no "let's see if it picks up in another quarter". Retire means retire.

This isn't a rhetorical commitment. Every block/allow event the guard produces emits a telemetry event including the feed version, advisory ID, and outcome — producing machine-readable evidence for the August 12 review.

We're making this commitment for two reasons:

1. **Discipline.** Shipping a security feature in 10 days after a public incident invites the suspicion that we're chasing news cycles rather than solving problems. The sunset commitment is our answer: we'll prove the feature earned its place, or we'll remove it.

2. **Calibration.** If the AI-Native Supply-Chain Guard hypothesis is right, telemetry will show real catches. If it's wrong, telemetry will show us spending users' attention without delivering value. Either outcome teaches us something real about the AI-coding tooling space.

## What this means for dw-kit users

- **Solo preset users:** zero impact. Opt in if you want it.
- **Team/Enterprise preset users:** `dw security-scan` available as CLI; hook fires automatically on lockfile edits in Claude Code sessions; `dw doctor` reports guard health (and fails loud if the advisory snapshot is stale).
- **Audit-friendly:** every block/allow event lands in `.dw/metrics/events.jsonl` with feed version, advisory ID, and SHA pin — reproducible audit trail.

## What we're NOT claiming

We are not claiming to replace Snyk, Socket.dev, or your existing security posture. Those tools cover surfaces dw-kit doesn't touch (CI scans, registry monitoring, license compliance). We are claiming to cover one specific gap they don't: the moment an AI agent commits a lockfile edit on a developer's local machine, before a human sees the diff.

If we're right about this being the dominant new attack surface in AI-assisted development, this guard becomes load-bearing. If we're wrong, August 12 retires it and we move on.

---

## Headline alternatives (TL picks one)

1. "Introducing dw-kit's AI-Native Supply-Chain Guard" (current)
2. "What yesterday's npm worm taught us — and what we're shipping in 10 days"
3. "Why we're shipping a supply-chain guard with a public 90-day expiration date"
4. "The AI agent edits your lockfile. Now what?"
5. "dw-kit v1.3.5: A supply-chain guard built for when AI agents write your dependencies"

## Distribution checklist (post-publish)

- [ ] Blog live on dw-kit site / GitHub README link
- [ ] Tweet thread (max 5 tweets, lead with sunset commitment)
- [ ] HN submission with prepared response: "Why not just use Snyk?"
- [ ] Team broadcast (Slack/email) to 2 dev teams using dw-kit
- [ ] Cross-link from ADR-0005 + supply-chain-incident-2026-05-12 docs

## Internal review checklist (TL before publish)

- [ ] No specific attack IoC details in blog (defender-policy framing only)
- [ ] No competitor disparagement
- [ ] Sunset date (2026-08-12) consistent with ADR-0005 and code constants
- [ ] "AI-Native" claim supported by hook-on-Edit-lockfile integration described
- [ ] Solo dev opt-in OFF clearly communicated (so solo users don't feel forced)
- [ ] FP rate threshold (5%) and zero-catches sunset condition stated verbatim
- [ ] Audit trail mention (events.jsonl) for enterprise readers

---

**Status: Draft. TL approves → publish target 2026-05-13 (Day 1). Implementation code ship target 2026-05-19 (Day 9).**
