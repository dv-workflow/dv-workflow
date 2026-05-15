import { createHighlighter, bundledLanguages } from 'shiki';

const DEFAULT_LANGS = [
  'javascript', 'typescript', 'jsx', 'tsx',
  'json', 'yaml', 'toml',
  'python', 'go', 'rust', 'java', 'php', 'ruby',
  'c', 'cpp', 'csharp', 'sh', 'bash', 'sql',
  'html', 'css', 'markdown',
];

const _byTheme = new Map();

async function getHighlighter(theme) {
  if (_byTheme.has(theme)) return _byTheme.get(theme);
  const supportedLangs = DEFAULT_LANGS.filter((l) => bundledLanguages[l]);
  const promise = createHighlighter({ themes: [theme], langs: supportedLangs });
  _byTheme.set(theme, promise);
  return promise;
}

/**
 * Tokenize code with shiki using a single theme.
 *
 * @param {string} code
 * @param {{lang?: string, theme?: string}} [opts]
 * @returns {Promise<{tokens: Array<Array<{content: string, color?: string}>>, fg: string, bg: string}>}
 */
export async function highlightTokens(code, opts = {}) {
  const theme = opts.theme || 'github-dark';
  const requestedLang = opts.lang || 'text';
  const h = await getHighlighter(theme);
  const loaded = new Set(h.getLoadedLanguages());
  const safeLang = loaded.has(requestedLang) ? requestedLang : 'text';
  const result = h.codeToTokens(code, { lang: safeLang, theme });
  return {
    tokens: result.tokens,
    fg: result.fg || '#c9d1d9',
    bg: result.bg || '#0d1117',
  };
}
