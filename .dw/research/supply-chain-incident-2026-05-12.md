---
title: Supply-Chain Incident Response — Mini Shai-Hulud TanStack Worm
date: 2026-05-12
author: huydv (TechLead) + Claude
cve: CVE-2026-45321
ghsa: GHSA-g7cv-rxg3-hmpx
attack-window: 2026-05-11 19:20-19:26 UTC
detection: 2026-05-11 ~19:40 UTC (StepSecurity, researcher ashishkurmi)
status: dw-kit clean (verified) | team-wide triage pending
---

# Supply-Chain Incident Response — Mini Shai-Hulud (TanStack worm)

## 1. Attack Summary

**TeamPCP** group (aliases: DeadCatx3, PCPcat, ShellForce, CipherForce) published 84 malicious versions across 42 `@tanstack/*` packages on **2026-05-11 19:20-19:26 UTC** via a `pull_request_target` Pwn Request + GitHub Actions cache poisoning + OIDC token theft from runner memory. The malware is a **self-propagating worm** that steals npm OIDC tokens from compromised CI environments and autonomously republishes itself under stolen maintainer identities — first documented npm worm producing **valid SLSA Level 3 attestations**.

### Scale (per [StepSecurity](https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem) + [Snyk](https://snyk.io/blog/tanstack-npm-packages-compromised/))

- **42** `@tanstack/*` packages (84 malicious versions)
- **70+** `@uipath/*` packages (RPA tooling)
- **1** `@opensearch-project/opensearch` (1.3M weekly downloads)
- **Mistral AI** `@mistralai/mistralai@2.2.3-2.2.4` (npm + PyPI)
- **DraftLab/DraftAuth**, **Squawk Aviation** (25+), **TallyUI**, **Mesa**, **TaskFlow**, **Tolka**, **Beproduct**, **Dirigible**
- Total worm spread: **169+ npm packages + 2 PyPI**

### Indicators of Compromise (IoC)

| Type | Value |
|---|---|
| Payload file | `router_init.js` (~2.3 MB, undeclared) |
| Exfil domains | `filev2.getsession.org`, `seed{1,2,3}.getsession.org` |
| Secondary payload URLs | `litter.catbox.moe/h8nc9u.js`, `litter.catbox.moe/7rrc6l.mjs` |
| Malicious git ref | `github:tanstack/router#79ac49eedf774dd4b0cfa308722bc463cfe5885c` |
| Attacker npm accounts | `zblgg` (id 127806521), `voicproducoes` (id 269549300) |

### Credential Targets (100+ file paths)

Cloud: AWS (IMDSv2/Secrets Manager/SSM), Azure, GCP, Kubernetes. CI: GitHub tokens via `/proc/{pid}/mem` of `Runner.Worker`. Dev: npm tokens, Python, Docker, Terraform, Git creds. Crypto: BTC, ETH, Monero, Zcash + Exodus/Electrum/Atomic desktop wallets. **AI: Claude config, Kiro MCP settings.** VPN: Proton/Nord/CyberGhost/OpenVPN configs. Messaging: Signal/Slack/Discord/Telegram. Shell history: bash/zsh/Python/MySQL.

---

## 2. dw-kit Status: CLEAN (verified)

### dw-kit dependency tree (13 packages)

| Direct | Version | In attack list? |
|---|---|---|
| ajv | 8.18.0 | No |
| chalk | 5.6.2 | No |
| commander | 14.0.3 | No |
| enquirer | 2.4.1 | No |
| js-yaml | 4.1.1 | No |
| Transitives (8) | — | No |

### IoC scan results

- `router_init.js` search across `node_modules/`: **0 matches**
- Oversized JS (>1MB) search: **0 matches**
- Grep `getsession.org|litter.catbox.moe`: **0 matches**
- Files modified after 2026-05-11 19:20 UTC in `node_modules/`: **0 matches**

### npm audit result

1 unrelated CVE: `fast-uri@3.1.0` (GHSA-q3j6-qgpj-74h6 path traversal + GHSA-v39h-62p7-jpjc host confusion). Low contextual risk for dw-kit (used by ajv for JSON schema only). Bump when convenient, not blocker.

---

## 3. Local Machine (TechLead workstation) Status: CLEAN

### npm activity since 2026-05-11 19:20 UTC

| Time UTC | Command | Verdict |
|---|---|---|
| 2026-05-12 04:46:13 | `npm install --ignore-scripts types-registry@latest` | TypeScript LS auto-update; `--ignore-scripts` ✓; package not in IoC list |
| 2026-05-12 04:46:27 | `npm install --ignore-scripts @types/node@latest --save-dev` | VS Code TS Server auto-update; `--ignore-scripts` ✓; official @types/node |
| 2026-05-12 06:22:08-18 | `npm view @anthropic-ai/claude-code@latest version --prefer-online` | Read-only version check |
| 2026-05-12 06:22:19 | `npm install --global @anthropic-ai/claude-code` | Claude Code auto-update to 2.1.139; Anthropic namespace; verified clean (no IoC, no large JS, no compromised deps) |
| 2026-05-12 07:14:58 | `npm ls --all --depth 99` | Session diagnostic (Claude assistant ran) |
| 2026-05-12 07:15:31 | `npm audit --json` | Session diagnostic (Claude assistant ran) |

### Filesystem scan

- `node_modules/` dirs under `D:\` modified after threshold: **0**
- `node_modules/` dirs under `C:\Users\APC\` modified after threshold: **0**
- `~/.claude/` modifications after threshold: only normal session files (sessions/, history.jsonl, backups/) — no foreign files, no unexpected MCP servers

### Verdict

**No credential rotation needed for this workstation.** Anthropic CLI was the only non-`--ignore-scripts` install today, but Anthropic namespace not in attack list and 2.1.139 verified clean.

---

## 4. Out-of-Scope / Pending Triage

Items NOT yet verified — TechLead must coordinate:

### Team's other dev machines (2 teams, ~10 devs)

Risk: anyone who ran `npm install`/`pnpm install`/`yarn install` on a project containing affected packages during 2026-05-11 19:20 UTC → ~24 hours later (until npm pulled malicious tarballs) is potentially compromised.

**Required broadcast to team** — see Section 5 template.

### Team's other repos / projects

Cross-reference required for each repo:

- Does `package.json` list any of: `@tanstack/*`, `@uipath/*`, `@opensearch-project/*`, `@mistralai/*`?
- Does `package-lock.json` pin a malicious version range (e.g. `@tanstack/react-router 1.169.5-1.169.8`)?
- If yes → fix version per advisory, rotate any credentials touched by CI

### CI/CD systems

If any GitHub Actions workflow ran `npm install` / `pnpm install` / `yarn install` during attack window with a vulnerable dep → **OIDC token may have been stolen** → attacker can publish under team's npm scope.

**Required:** audit GitHub Actions runs in window, rotate npm publish tokens, rotate GitHub PATs used in CI.

---

## 5. Team Broadcast Template

```
SUBJECT: Supply-chain alert — Mini Shai-Hulud / TanStack npm worm (action required)

Team, urgent supply-chain incident:

WHAT: On 2026-05-11 19:20-19:26 UTC, attackers published 84 malicious
versions of 42 @tanstack/* npm packages. The worm self-propagated via
stolen npm OIDC tokens; total spread is 169+ packages (TanStack, UiPath,
OpenSearch, Mistral, Squawk and others).

CVE: CVE-2026-45321 / GHSA-g7cv-rxg3-hmpx

WHO IS AT RISK:
- Anyone who ran npm/pnpm/yarn install during the attack window on a
  project containing affected packages, OR
- Any CI build (GitHub Actions especially) that ran install in window

WHAT TO CHECK NOW:
1. Run on your dev machine:
   npm ls --all 2>&1 | grep -E "@tanstack|@uipath|@opensearch-project|@mistralai"

2. If matches found, check version against advisory:
   https://github.com/advisories/GHSA-g7cv-rxg3-hmpx

3. Search for IoC file:
   find . -name "router_init.js" 2>/dev/null

4. If any match → STOP using machine, rotate credentials below, contact me

CREDENTIALS TO ROTATE if exposed:
- npm token (npm token revoke)
- GitHub PATs + SSH keys
- AWS/Azure/GCP keys
- Anthropic API key (Claude config target)
- Crypto wallet seeds (if held on machine)
- VPN configs (Proton/Nord/CyberGhost/OpenVPN)

PRECAUTION FOR ALL:
- Don't run `npm update` until further notice
- Set: npm config set ignore-scripts true (temporary)
- Pin deps to versions BEFORE 2026-05-11 19:00 UTC in lockfile

Sources:
- https://github.com/advisories/GHSA-g7cv-rxg3-hmpx
- https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem
- https://tanstack.com/blog/npm-supply-chain-compromise-postmortem

Report any findings here: [TechLead Slack/email]
```

---

## 6. Lessons + Action Items

### Lessons

1. **`--ignore-scripts` saved this machine.** TypeScript LS auto-installs use it by default. Claude Code auto-install did NOT, but namespace happened to be safe.
2. **Anthropic namespace protected** — no overlap with attack. Different from typosquat risks.
3. **No CI on dw-kit** = limited blast radius. CI introduces npm OIDC tokens which were the worm's spread vector.
4. **Detection window was 20 minutes.** Fast, but worm spread in those minutes.

### Action items (this incident)

| # | Action | Owner | Due |
|---|---|---|---|
| A1 | Broadcast team template (Section 5) | TechLead | Today |
| A2 | Audit all team repos for `@tanstack/*`/`@uipath/*`/`@mistralai/*`/`@opensearch-project/*` | TechLead delegate per team | 2026-05-13 |
| A3 | Audit GitHub Actions runs in window for affected repos | TechLead | 2026-05-13 |
| A4 | Pin all team repos' lockfiles to pre-2026-05-11 19:00 UTC versions until fixed | Team leads | 2026-05-14 |
| A5 | Rotate npm publish tokens for any team repo that publishes to npm | Repo owners | 2026-05-13 |
| A6 | Bump dw-kit `fast-uri` (unrelated CVE) | TechLead | This week, low priority |

### Action items (proactive — see [supply-chain-guard-proposal.md](supply-chain-guard-proposal.md))

Design proactive dw-kit guard to detect similar attacks early on team machines. Saved separately.

---

## 7. References

- [GHSA-g7cv-rxg3-hmpx (GitHub Advisory)](https://github.com/advisories/GHSA-g7cv-rxg3-hmpx)
- [TanStack Postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)
- [StepSecurity full IoC list + attack analysis](https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem)
- [Snyk advisory](https://snyk.io/blog/tanstack-npm-packages-compromised/)
- [Socket.dev analysis](https://socket.dev/blog/tanstack-npm-packages-compromised-mini-shai-hulud-supply-chain-attack)
- [Aikido — Mini Shai-Hulud back](https://www.aikido.dev/blog/mini-shai-hulud-is-back-tanstack-compromised)
- [Wiz Blog](https://www.wiz.io/blog/mini-shai-hulud-strikes-again-tanstack-more-npm-packages-compromised)
- Companion proposal: [supply-chain-guard-proposal.md](supply-chain-guard-proposal.md)

---

**Status: Local + dw-kit clean. Team-wide triage pending broadcast.**
