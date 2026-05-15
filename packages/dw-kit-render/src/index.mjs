import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { highlightTokens } from './highlight.mjs';
import { buildCard, CARD_LAYOUT_CONSTANTS } from './layout.mjs';
import { resolveFont } from './fonts.mjs';

/**
 * Render a dw-kit review manifest into per-finding SVG + PNG cards.
 *
 * Contract (matches `dw review render` CLI shim in dw-kit):
 *   render({ manifest, outDir, formats?, theme?, font? }) →
 *     Promise<{ svgPaths: string[], pngPaths: string[] }>
 *
 * @param {object} opts
 * @param {object} opts.manifest - validated manifest (schema v1)
 * @param {string} opts.outDir - absolute or relative dir where artifacts are written
 * @param {string[]} [opts.formats=['svg','png']] - subset of ['svg','png']
 * @param {string} [opts.theme='github-dark'] - shiki theme name
 * @param {string|Buffer} [opts.font] - path to TTF/OTF OR Buffer. Auto-detects system font if omitted.
 *                                       PNG output requires a path (Buffer-only works for SVG).
 * @returns {Promise<{svgPaths: string[], pngPaths: string[]}>}
 */
export async function render(opts) {
  const { manifest, outDir, theme = 'github-dark' } = opts || {};
  const formats = Array.isArray(opts?.formats) && opts.formats.length ? opts.formats : ['svg', 'png'];

  if (!manifest || !Array.isArray(manifest.findings)) {
    throw new Error('dw-kit-render: manifest with findings[] is required');
  }
  if (!outDir) throw new Error('dw-kit-render: outDir is required');

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const { buffer: fontBuf, path: fontPath } = resolveFont(opts?.font);
  const satoriFonts = [{ name: 'Code', data: fontBuf, weight: 400, style: 'normal' }];

  const svgPaths = [];
  const pngPaths = [];

  for (const finding of manifest.findings) {
    const themed = finding.code_snippet
      ? await highlightTokens(finding.code_snippet, { lang: finding.language, theme })
      : { tokens: [], fg: '#c9d1d9', bg: '#0d1117' };

    const tree = buildCard({ finding, themed });
    let svg;
    try {
      svg = await satori(tree, { width: CARD_LAYOUT_CONSTANTS.CARD_WIDTH, fonts: satoriFonts });
    } catch (e) {
      throw new Error(`dw-kit-render: satori failed on finding ${finding.id}: ${e.message}`);
    }

    if (formats.includes('svg')) {
      const p = join(outDir, `finding-${finding.id}.svg`);
      writeFileSync(p, svg, 'utf-8');
      svgPaths.push(p);
    }

    if (formats.includes('png')) {
      if (!fontPath) {
        // resvg-js fontFiles wants paths on disk; Buffer-only font means SVG-only output.
        continue;
      }
      try {
        const resvg = new Resvg(svg, {
          font: {
            fontFiles: [fontPath],
            loadSystemFonts: true,
            defaultFontFamily: 'Code',
          },
          background: '#0d1117',
        });
        const png = resvg.render().asPng();
        const p = join(outDir, `finding-${finding.id}.png`);
        writeFileSync(p, png);
        pngPaths.push(p);
      } catch (e) {
        throw new Error(`dw-kit-render: resvg failed on finding ${finding.id}: ${e.message}`);
      }
    }
  }

  return { svgPaths, pngPaths };
}

export { resolveFont, CARD_LAYOUT_CONSTANTS };
export default { render };
