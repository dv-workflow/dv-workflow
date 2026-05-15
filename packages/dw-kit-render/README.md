# dw-kit-render

Optional renderer for [`dw-kit`](https://github.com/dv-workflow/dv-workflow) `/dw:review --visual`. Turns a structured findings manifest into SVG + PNG cards.

Pure JS + WASM (shiki + satori + @resvg/resvg-js). No native build. Works on Windows / Linux / macOS / ARM. Install via `npm install -g dw-kit-render` once and `/dw:review --visual` produces image artifacts.

See [ADR-0007](https://github.com/dv-workflow/dv-workflow/blob/main/.dw/decisions/0007-decoupled-review-render-pipeline.md) for the architecture.

## Install

```sh
# Global install — picked up by `dw review render` automatically.
npm install -g dw-kit-render

# Or per-project.
npm install --save-dev dw-kit-render
```

Check installation:

```sh
dw doctor   # surfaces Review Render Pipeline section
```

## Use via dw-kit

```sh
# 1. /dw:review --visual  (skill writes .dw/reviews/{scope}/manifest.json)
# 2. CLI shim invokes:
dw review render .dw/reviews/{scope}/manifest.json
```

Outputs:

- `.dw/reviews/{scope}/finding-{id}.svg`
- `.dw/reviews/{scope}/finding-{id}.png`
- `.dw/reviews/{scope}/summary.md` (cross-linked with image paths)

## Use programmatically

```js
import { render } from 'dw-kit-render';

const { svgPaths, pngPaths } = await render({
  manifest,                     // matches dw-kit manifest schema v1
  outDir: '.dw/reviews/x',
  formats: ['svg', 'png'],      // or ['svg'] / ['png']
  theme: 'github-dark',         // any shiki theme
  font: '/abs/path/to/font.ttf' // optional; auto-detects Consolas/DejaVu/Menlo if omitted
});
```

## Font

`satori` and `resvg` both need a font file. By default `dw-kit-render` auto-detects a sensible monospace font on the host:

- Windows: `C:\Windows\Fonts\consola.ttf` (Consolas)
- Linux: `/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf`
- macOS: `/System/Library/Fonts/Menlo.ttc`

All three cover Vietnamese diacritics + CJK fallback well enough for review cards. To override, pass `font: '/path/to/your.ttf'` (must be TTF/OTF).

If no font is found, render throws a clear error pointing to install hints.

## Severity colors

| Severity     | Bar color | Label |
|--------------|-----------|-------|
| `critical`   | Red       | CRITICAL |
| `warning`    | Amber     | WARNING |
| `suggestion` | Blue      | SUGGESTION |

Bar bg + text computed for contrast. Severity drives banner color only; code block stays themed via shiki.

## Schema

Renderer consumes manifest schema v1 from `dw-kit`. Source: [`src/lib/review/manifest-schema.json`](https://github.com/dv-workflow/dv-workflow/blob/main/src/lib/review/manifest-schema.json).

Bumping schema = renderer rejects mismatched versions with clear error. Renderer follows semver of `dw-kit` for schema compatibility.

## License

MIT.
