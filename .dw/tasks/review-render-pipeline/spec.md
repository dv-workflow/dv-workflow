---
task_id: review-render-pipeline
created: 2026-05-14
status: In Progress
owner: huygdv
depth: standard
related_adr: ADR-0007
target_ship: none
---

# Spec: Decoupled Review Render Pipeline

## Intent

Cho phép `/dw:review` sinh visual artifact (SVG + PNG) per finding để human dev tiếp nhận và xử lý nhanh. Render layer decoupled qua sub-package `dw-kit-render` (pure-JS + WASM) — main `dw-kit` package giữ nguyên lean. Universal install qua `npm`, không phụ thuộc system binary (silicon/cairo/Python/.NET).

## Why Now

GitHub Issue #9 (suggestion từ user dùng dw-kit trên `torit-source`). User đã validate workflow PNG bằng silicon + annotate.ps1 (Windows-only), muốn dw-kit chính thức hóa capability này nhưng cross-platform. Adversarial review (Round 1+2+3) đã clarify constraints + arch optimal. Không có deadline cứng — implement khi capacity cho phép sau khi v1.3.6 ship.

## Scope

### In Scope

**ST-1: Manifest schema + JSON Schema validator**
- File: `src/lib/review/manifest-schema.json`
- Fields: `{scope, generated_at, findings[]}` với mỗi finding `{id, severity, title, location: {file, line_start, line_end}, rule_ref, body, fix, code_snippet, language}`
- Acceptance: AJV validation pass cho 5 sample manifest (1 valid + 4 invalid edge cases)
- Effort: 0.5d

**ST-2: SKILL.md `--visual` branch + Write permission**
- Edit `.claude/skills/dw-review/SKILL.md`:
  - Thêm `Write` vào `allowed-tools` (scope hẹp: chỉ write `.dw/reviews/{scope-slug}/manifest.json`)
  - Thêm Step 5-alt: khi `--visual` flag, LLM produces manifest JSON thay vì inline report; sau đó invoke `dw review render` via Bash
- Acceptance: skill chạy được, manifest match schema
- Effort: 0.5d

**ST-3: `dw review render` CLI subcommand (shim trong main package)**
- File: `bin/dw.mjs` + `src/commands/review-render.mjs`
- Logic:
  1. Load + validate manifest
  2. `require.resolve("dw-kit-render")` → nếu có, delegate render
  3. Nếu không có → write `summary.md` markdown only + prompt user install `dw-kit-render`
  4. Exit code 0 trong cả 2 trường hợp (markdown fallback không phải lỗi)
- Acceptance: cả 2 path (with/without `dw-kit-render`) đều produce output file + clear stdout message
- Effort: 0.5d

**ST-4: Scope-slug sanitization utility**
- File: `src/lib/review/scope-slug.mjs`
- Logic: branch name `fix/sc-guard-v1.3.6` → slug `fix-sc-guard-v1.3.6`. Strip `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`. Max length 80. Lowercase optional.
- Acceptance: 10 test cases (Windows-illegal chars, length cap, unicode)
- Effort: 0.25d

**ST-5: `dw.config.yml` thêm renderer config keys**
- Keys mới: `claude.review.renderer.{strategy, theme, font, output_dir, formats}`
- Defaults: `strategy: auto`, `theme: github-dark`, `font: "JetBrains Mono"`, `output_dir: .dw/reviews`, `formats: [svg, png]`
- Acceptance: config validation pass, default values áp dụng khi key thiếu
- Effort: 0.25d

**ST-6: `.dw/reviews/` lifecycle integration**
- Edit `dw archive` command: thêm `.dw/reviews/{scope}/` vào archive scope khi task được archive
- Add `.dw/reviews/` vào `.gitignore` mặc định (parallel với `.dw/metrics/`)
- Acceptance: `dw archive` move reviews kèm task; new project init thì gitignored
- Effort: 0.25d

**ST-7: `dw doctor` command**
- File: `src/commands/doctor.mjs`
- Logic: kiểm tra `dw-kit-render` resolvable; node version; config valid; print status table
- Acceptance: chạy `dw doctor` ra báo cáo có/không có renderer, prompt install command nếu thiếu
- Effort: 0.5d

**ST-8: Sub-package `dw-kit-render` — package skeleton**
- Location: `packages/dw-kit-render/` (monorepo) HOẶC separate repo (quyết khi start ST-8)
- Deps: `shiki`, `satori`, `@resvg/resvg-js`, Noto Sans Mono subset font
- Entry: `render(manifestPath, outputDir, options) → Promise<{svgPaths[], pngPaths[]}>`
- Acceptance: `npm pack` size <20MB, install + import work trên Win/Linux/Mac
- Effort: 1d

**ST-9: Sub-package `dw-kit-render` — render implementation**
- Per finding:
  1. shiki tokenize `code_snippet` với `language`
  2. satori compose: severity chip (color-coded) + title + file:line + code highlighted + body + fix action
  3. Output SVG; resvg convert → PNG
- File: `packages/dw-kit-render/src/render.mjs`
- Acceptance: render 5 TORIT-5-style sample findings → snapshot SVG match + PNG byte-size sane
- Effort: 1.5d

**ST-10: Telemetry events**
- File: `src/lib/telemetry.mjs` (existing)
- New events: `review.visual.invoked`, `review.render.format` (svg|png|both), `review.render.duration_ms`, `review.render.fallback_reason` (no-renderer|invalid-manifest|render-error)
- Acceptance: events written to `.dw/metrics/events.jsonl` khi `--visual` chạy
- Effort: 0.25d

**ST-11: Docs**
- `docs/review-renderer.md`: install, config, screenshots, plugin protocol (cho người viết custom renderer trong tương lai)
- README cập nhật section setup với optional `dw-kit-render`
- Acceptance: docs có ít nhất 1 screenshot mỗi severity
- Effort: 0.5d

**ST-12: Sample artifacts + integration test**
- Test fixture: 5 findings replicate TORIT-5 case (1 critical + 3 warning + 1 suggestion)
- Smoke test: `node src/smoke-test.mjs` extends với `review-render` case
- Acceptance: artifacts checked in `tests/fixtures/review-render/`, smoke test pass
- Effort: 0.5d

### Out of Scope (Won't Contain)

- **silicon adapter** — Round 2 path deprecated. Không ship silicon support trong MVP.
- **annotate.ps1 / .NET / Python composition** — user giữ làm personal tool nếu muốn; dw-kit không own.
- **Custom renderer plugin protocol** — schema được publish nhưng plugin registry/loader defer post-MVP (sau khi telemetry justify).
- **PR comment auto-posting** — `dw review render` chỉ output files; pipeline `gh pr comment` để Phase 3.
- **Headless browser rendering** — không dùng puppeteer/playwright (heavy, 300MB+ Chromium).
- **Bundle `dw-kit-render` vào main** — luôn là optional sub-package.

## Timeline

Không có ship deadline cứng. Estimate effort tổng: ~6.5d. Có thể chạy parallel ST-1+ST-4+ST-5 vì độc lập.

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| satori SVG output incompatible với resvg edge cases (font fallback, gradients) | M | Bundle Noto Sans Mono; smoke test cover Vietnamese + CJK; pin lib versions |
| Sub-package install friction (user không hiểu prompt) | M | `dw doctor` provides clear command; first-run error message contains exact `npm install` line |
| Token footprint của SKILL.md tăng | L | `--visual` branch trong skill chỉ thêm ~30 lines; benchmark trước/sau |
| Render time chậm cho diff lớn (>50 findings) | L | Cap snippet 50 lines; parallelize via Promise.all; warn nếu >20 findings |
| Manifest schema breaking change sau khi ship | M | Version field bắt buộc; CLI validate version + clear error nếu mismatch |
| `dw-kit-render` package size bloat theo thời gian | L | CI check `npm pack` size < 20MB; tree-shake shiki themes |

## Success Criteria

- [ ] `npm install -g dw-kit && npm install -g dw-kit-render` → `/dw:review --visual` produce SVG + PNG trên Win/Linux/Mac (verified manually 3 platforms)
- [ ] Render time < 1.5s per finding average
- [ ] Sample artifacts visual review approved by TL (5 findings)
- [ ] Vietnamese diacritics render correctly trong SVG + PNG
- [ ] `dw doctor` exit code 0 khi setup complete
- [ ] Smoke test pass
- [ ] Telemetry events ghi đủ trong sample run
- [ ] User torit-source confirm artifact quality ≥ annotate.ps1 baseline

## Dependencies

- ADR-0007 (Accepted) — kiến trúc decoupled pipeline
- `shiki`, `satori`, `@resvg/resvg-js` upstream stability (cả 3 đều active maintained, >1k stars)
- v1.3.6 ship trước (current branch `fix/sc-guard-chunked-sync-v1.3.6`)

## Known Unknowns

- Monorepo vs separate repo cho `dw-kit-render`? — quyết khi start ST-8 dựa trên CI complexity
- Schema versioning: SemVer trong manifest, hay separate `schema_version` field? — propose `schema_version: 1` ban đầu
- `dw doctor` output format: plain text hay JSON option? — start plain, JSON sau nếu CI cần
- Custom renderer plugin protocol: subprocess+JSON stdin/stdout hay dynamic require? — defer, không phải MVP

## Acceptance (Task Complete When)

- [ ] All 12 subtasks done
- [ ] ADR-0007 status flipped Proposed → Accepted
- [ ] Issue #9 closed với link tới merged PR(s)
- [ ] `dw-kit-render` published to npm
- [ ] Docs published; README updated
- [ ] Telemetry verified in `.dw/metrics/events.jsonl` from real `--visual` run
- [ ] User torit-source feedback collected (close the loop)
