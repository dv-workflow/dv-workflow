# ADR-0007: Decoupled Review Render Pipeline

## Status: Accepted
## Date: 2026-05-14
## Deciders: huygdv (TechLead, dw-kit maintainer)

---

## Context

GitHub Issue #9 đề xuất `/dw:review` sinh visual artifact (PNG) per finding để human dev nhận-và-xử-lý nhanh hơn so với markdown wall-of-text. User đã build reference impl trên project `torit-source` (silicon CLI + Windows-only `annotate.ps1` qua .NET System.Drawing), validate trên TORIT-5 (5 findings: 1 critical + 3 warning + 1 suggestion).

Forces đang tác động:

1. **User goal:** universal PNG output cho bất kỳ user nào dùng dw-kit trên bất kỳ repo nào (Win/Linux/Mac).
2. **Lean mandate (ADR-0001):** main package phải nhẹ; token footprint của skills load mỗi session phải kiểm soát.
3. **Cross-platform Windows-compat:** CLAUDE.md mandate "Hooks python3-free (node only)". Native binary install gây friction enterprise (corporate firewall chặn postinstall download).
4. **Zero secret leak:** code findings không được rời máy user (rejection của carbon.now.sh / ray.so API options).
5. **Determinism:** output schema phải enforced (LLM-filled markdown templates produce non-deterministic structure).

Adversarial review qua `dw-kit-evolve` (3 rounds):
- **R1 white-bot:** đề xuất markdown-only `--visual` flag → reject vì bait-and-switch (markdown ≠ PNG cho PO/QC audience).
- **R1 black-bot:** caught missing `Write` perm, pillar mismap, `.dw/reviews/` lifecycle gap, scope-slug path collision.
- **R2 TL:** propose decoupled pipeline với silicon (external Rust binary) làm default renderer.
- **R3 TL (sau user clarification):** silicon đòi system-level install (cargo/brew/choco) — không universal qua npm-only. Switch sang pure-JS/WASM sub-package.

## Options Considered

### Option A: Markdown-only output (no PNG)

Extend `/dw:review` với `--visual` flag, LLM writes structured markdown findings to `.dw/reviews/{scope}/`.

- **Pros:** Zero new deps. Trivial implementation.
- **Cons:** **Does not meet goal.** Bait-and-switch — user asked for PNG, audience (PO/QC) doesn't consume markdown well. LLM output non-deterministic schema.

### Option B: silicon external CLI as default renderer

Skill produces JSON manifest; `dw review render` shim invokes `silicon` if found in PATH, fallback markdown.

- **Pros:** Cross-platform (silicon Rust binary). Local-only privacy. No npm bloat.
- **Cons:** User must install silicon via `cargo install` / `brew install` / `choco install` — system-level, not universal via npm. Corporate firewall blocks. silicon output composition limited (only window-title, no rich severity card). Vietnamese/CJK depends on system font.

### Option C: Pure-JS sub-package (chosen)

Ship `dw-kit-render` as optional npm sub-package using `shiki` (highlight) + `satori` (CSS layout → SVG) + `@resvg/resvg-js` (SVG → PNG, WASM). Main `dw-kit` stays lean. Auto-detect via `require.resolve("dw-kit-render")`; prompt install on first `--visual` use; fallback markdown if absent.

- **Pros:**
  - **Universal:** `npm install -g dw-kit-render` works on Win/Linux/Mac/ARM. Just npm, no system pkg mgr.
  - **No native build:** all 3 libs pure-JS or WASM. No Visual Studio / build-essential / Python required.
  - **No postinstall download:** WASM bundled in npm tarball; corporate firewall safe.
  - **Rich composition:** satori = full CSS layout (severity chip, banner, body, action).
  - **i18n safe:** Bundle Noto Sans Mono subset → Vietnamese + CJK consistent across platforms.
  - **Battle-tested:** stack used by Vercel OG image, Nuxt OG (millions of sites).
  - **Privacy:** local-only rendering, no network.
  - **Token footprint:** render logic ở `bin/` + sub-package, không bloat skill markdown.
- **Cons:**
  - User cần 1 lệnh extra (`npm install -g dw-kit-render`, ~15-20MB) trước khi PNG works.
  - Maintain 2 published packages thay vì 1.
  - Schema thành public API surface — versioning required.
  - Sub-package size grows nếu add nhiều themes/langs/fonts.

### Option D: Bundle shiki+satori+resvg vào main `dw-kit`

- **Pros:** Zero-friction UX. Single `npm install`.
- **Cons:** Main package +15-20MB. Solo preset users (không dùng `/dw:review`) gánh bloat. Ngược ADR-0001 lean mandate.

### Option E: Headless browser (puppeteer/playwright)

- **Pros:** Full HTML/CSS rendering fidelity.
- **Cons:** Chromium ~300MB. Slow startup. Rejected for size + complexity.

## Decision

**Chọn Option C — Pure-JS sub-package `dw-kit-render`.**

Architecture:

```
[/dw:review --visual]
        ↓ (LLM via skill)
.dw/reviews/{scope-slug}/manifest.json   ← Records pillar (versioned schema)
        ↓ (Bash: dw review render <manifest>)
[bin/dw.mjs → src/commands/review-render.mjs]
        ↓
require.resolve("dw-kit-render")
   ├── found → invoke renderer
   │            ├── shiki(code) → tokens
   │            ├── satori(layout + tokens) → SVG
   │            └── resvg(SVG) → PNG
   │            ↓
   │   .dw/reviews/{scope}/{summary.md, finding-{N}.svg, finding-{N}.png}
   │
   └── not found → write markdown summary + prompt user install
                   ↓
                   .dw/reviews/{scope}/summary.md (markdown-only fallback)
```

**Output:** Both SVG (primary, scalable, code-copyable) + PNG (derived, universal embed). Marginal cost ~zero when pipeline already runs.

**Pillar mapping:**
- `manifest.json` schema → **Records** (versioned audit artifact)
- `.dw/reviews/{scope}/` → **Bridges** (consumed by `/dw:execute` for fix loop)
- Renderer config (`claude.review.renderer.*`) → **Tunes** (team theme/font/format choice)
- `dw doctor` command → **Surfaces** (tooling state visibility)

**Skill changes:**
- `.claude/skills/dw-review/SKILL.md`: add `Write` to `allowed-tools` (scope HẸP — chỉ `manifest.json`); add `--visual` Step 5-alt.

**Phasing (in execution task `review-render-pipeline`, see spec.md):**
- Phase 0 (main package): schema + skill branch + CLI shim + config + doctor + archive integration
- Phase 1 (sub-package): `dw-kit-render` skeleton + render impl
- Phase 2: telemetry + docs + sample artifacts

**Out of scope:**
- silicon adapter (R2 deprecated)
- annotate.ps1 / Python / .NET composition (user's personal tool, không gánh maintenance)
- Custom renderer plugin protocol (defer post-MVP, evaluate after telemetry)
- PR comment auto-post (Phase 3+)
- Bundle into main package (Option D rejected)
- Headless browser (Option E rejected)

## Consequences

**Positive:**

- Goal đạt được: universal PNG output qua `npm install` thuần trên mọi platform.
- Main package giữ lean (ADR-0001 honored).
- Stack pure-JS/WASM = không native build pain, không firewall block.
- Rich severity card composition (satori CSS layout) > silicon-only.
- Vietnamese/CJK consistent qua bundled Noto Sans Mono.
- Manifest schema versioned → external tools (kể cả user's annotate.ps1) có thể consume nếu muốn render khác.
- SVG-first cho code findings preserves text searchability + copyability.
- Render local-only, không leak code ra third-party API.

**Negative (trade-offs chấp nhận):**

- 1 lệnh install extra cho user muốn PNG (`npm install -g dw-kit-render` ~15-20MB).
- Maintain 2 npm packages thay vì 1 (versioning + release process tăng overhead).
- Manifest schema thành public API → breaking changes phải gate qua SemVer + migration notes.
- Sub-package install có thể fail trên restricted npm environments (offline / private registry without mirror) — fallback markdown đảm bảo dw-kit không crash, nhưng UX degraded.
- Render time ~1.5s per finding average (acceptable cho review workflow, không phải hot path).
- Sub-package size có risk grow theo thời gian khi user request thêm themes/langs.

**Neutral:**

- New public surface: `.dw/reviews/{scope}/` directory, `dw review render` CLI, `dw doctor` CLI, `dw.config.yml` renderer keys.
- `dw archive` scope mở rộng — backwards compatible (silently skip nếu thư mục trống).
- `Write` tool added to review skill — scope-narrow, single file, low risk.
- Janitor (Pillar 6, ADR-0003 deferred): khi GA, `.dw/reviews/` là candidate cho autonomous cleanup.

## References

- Related ADRs:
  - ADR-0001 (v2 Pragmatic Lean) — lean mandate respected via sub-package
  - ADR-0003 (Pillar 6 Janitors) — future cleanup target
- Related tasks:
  - `.dw/tasks/review-render-pipeline/spec.md` — implementation plan
- GitHub Issue:
  - https://github.com/dv-workflow/dv-workflow/issues/9 (3 rounds adversarial review)
- External libs (load-bearing):
  - shiki: https://shiki.style — pure-JS syntax highlighter
  - satori: https://github.com/vercel/satori — JSX/CSS → SVG
  - @resvg/resvg-js: https://github.com/yisibl/resvg-js — SVG → PNG via WASM
  - Noto Sans Mono: i18n font for Vietnamese + CJK
