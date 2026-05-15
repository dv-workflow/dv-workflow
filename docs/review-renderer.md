# Review Renderer — visual artifacts for `/dw:review`

> Status: shipping in v1.4 — see [ADR-0007](../.dw/decisions/0007-decoupled-review-render-pipeline.md).
> Issue: [#9](https://github.com/dv-workflow/dv-workflow/issues/9).

`/dw:review` produces text findings. When you want **visual artifacts** (PNG + SVG cards per finding) for sharing in PR comments, Slack, or with non-technical stakeholders, pass `--visual` and dw-kit will render each finding into a self-contained image card.

Rendering is **opt-in** via a separate package, `dw-kit-render`, so the main `dw-kit` install stays lean.

## Quickstart

```sh
# 1. One-time renderer install (any platform — npm only, no system deps).
npm install -g dw-kit-render

# 2. Verify.
dw doctor   # "Review Render Pipeline" section should show the package as resolvable

# 3. Use.
/dw:review --visual                  # via Claude Code slash command
# or run dw review render manually against an existing manifest:
dw review render .dw/reviews/{scope}/manifest.json
```

Outputs land in `.dw/reviews/{scope-slug}/`:

```
.dw/reviews/{scope-slug}/
├── manifest.json              ← Written by /dw:review --visual
├── summary.md                 ← Markdown index with links to artifacts
├── finding-{id}.svg           ← Scalable, code copyable
└── finding-{id}.png           ← Universal embed (PR comment paste)
```

## What a rendered card looks like

Each card is 1200px wide and contains:

1. **Severity banner** (color-coded: critical=red, warning=amber, suggestion=blue) with the finding title.
2. **Subheader** — `file:line` location + optional rule reference.
3. **Code block** — syntax-highlighted via shiki (50 line cap to keep cards scannable).
4. **Body** — explanation, plain text.
5. **Fix banner** (when present) — green, prefixed with `FIX →`.
6. **Footer** — finding ID for cross-reference.

SVG and PNG ship together by default. SVG preserves vector text-as-paths (smaller embed when scaled); PNG is for paste-into-anywhere.

## Configuration

`.dw/config/dw.config.yml` under `claude.review.renderer`:

```yaml
claude:
  review:
    renderer:
      strategy: auto                # auto | plugin | markdown-only
      theme: "github-dark"          # any shiki theme
      font: "JetBrains Mono"        # font family OR absolute path to .ttf/.otf
      formats: ["svg", "png"]       # subset of [svg, png]
      output_dir: ".dw/reviews"
```

| Strategy | Behavior |
|---|---|
| `auto` (default) | Try `dw-kit-render`; if absent, write `summary.md` markdown only with install hint. Exit 0 either way. |
| `plugin` | Require `dw-kit-render`; fail loudly with install hint if missing. |
| `markdown-only` | Skip renderer entirely. Useful for CI where you only want the markdown trail. |

### Font resolution

`font` accepts either a font family name (advisory only — auto-detects a system mono) or an absolute path to a TTF/OTF file. Auto-detection covers:

- Windows: `Consolas` → `Lucida Console` → `Courier New`
- Linux: `DejaVu Sans Mono` → `Liberation Mono`
- macOS: `Menlo` → `Monaco` → `Courier New`

All three default fonts cover Latin Extended (Vietnamese diacritics render correctly). To override with your own font, set `font: "/abs/path/to/font.ttf"`.

If no font can be resolved, `dw review render` falls back to `markdown-only` mode with a clear error so the workflow never blocks.

## CLI

```sh
dw review render <manifest> [options]

Options:
  -f, --format <kind>     Override formats: svg | png | both
  -s, --strategy <name>   Override strategy: auto | plugin | markdown-only
  -q, --quiet             Suppress info logs (errors still surface)
```

Environment:
- `DW_REVIEW_NO_RENDERER=1` → force markdown fallback (useful for testing or environments without the plugin).
- `DW_NO_TELEMETRY=1` → suppress the `review_render` event.

## Manifest schema

Both `/dw:review --visual` and `dw review render` operate on a versioned JSON manifest. Source: [`src/lib/review/manifest-schema.json`](../src/lib/review/manifest-schema.json).

Shape (v1):

```json
{
  "schema_version": 1,
  "scope": "feat/x",
  "scope_slug": "feat-x",
  "generated_at": "2026-05-15T10:00:00Z",
  "task_id": "review-render-pipeline",
  "review_meta": { "reviewer": "dw-review", "depth": "standard", "diff_base": "main", "files_reviewed": 3 },
  "findings": [
    {
      "id": "f1",
      "severity": "critical",
      "title": "SQL injection vector",
      "location": { "file": "src/api.mjs", "line_start": 38, "line_end": 42 },
      "rule_ref": "Security §2",
      "body": "User input is interpolated directly into the SQL string…",
      "fix": "Use parameterized query.",
      "code_snippet": "const q = `SELECT * FROM u WHERE id=${id}`;",
      "language": "javascript"
    }
  ]
}
```

The schema is enforced — bad manifests exit non-zero with a clear path-prefixed error. `schema_version` mismatch surfaces a dedicated upgrade message instead of generic AJV noise.

## Telemetry

`dw review render` emits a `review_render` event to `.dw/metrics/events.jsonl` with:

| Field | Values |
|---|---|
| `action` | `success` · `partial` · `fail` |
| `strategy` | `plugin` · `fallback-markdown` · `markdown-only` · `plugin-missing` |
| `formats` | array of requested formats |
| `findings` | count |
| `duration_ms` | render wall time |
| `fallback_reason` | `no-renderer` · `invalid-manifest` · `config-markdown-only` · `null` |

Use `dw metrics show` to inspect locally. Useful for tuning Phase 2 decisions (e.g., does the team actually use `--visual`?). Disable with `DW_NO_TELEMETRY=1`.

## Privacy

All rendering happens **locally** — shiki tokenization, satori layout, resvg PNG encoding. No code or finding content is sent over the network. Fonts are read from local disk only.

## Archiving and `.gitignore`

Artifacts are **per-machine ephemeral**. `.dw/reviews/` is in the default `.gitignore`. Re-running `/dw:review --visual` regenerates everything.

When you archive a task via `/dw:archive {task-name}`, the matching `.dw/reviews/{task-name}/` directory is removed.

## Troubleshooting

**"`dw-kit-render` not found — emitting markdown summary only"**
→ Expected when renderer not installed. Run `npm install -g dw-kit-render`.

**"satori failed on finding {id}"**
→ Usually a font issue. Check `dw doctor` and verify a mono font is available, or set `font:` to an absolute path.

**"resvg failed on finding {id}"**
→ Rare. Check that the resolved font is a TTF/OTF (not WOFF2). Pass `--format svg` to skip PNG conversion temporarily.

**PNG looks empty / no text**
→ resvg-js requires the font on disk, not just in memory. If you passed `font` as a `Buffer`, PNG output is skipped. Use a path instead.

**Vietnamese / CJK glyphs missing**
→ The auto-detected system font may not cover those scripts. Set `font:` to a path that does (e.g., Noto Sans Mono CJK).

## References

- [ADR-0007 — Decoupled Review Render Pipeline](../.dw/decisions/0007-decoupled-review-render-pipeline.md)
- [Manifest schema](../src/lib/review/manifest-schema.json)
- [GitHub Issue #9](https://github.com/dv-workflow/dv-workflow/issues/9)
- [shiki](https://shiki.style) · [satori](https://github.com/vercel/satori) · [@resvg/resvg-js](https://github.com/yisibl/resvg-js)
