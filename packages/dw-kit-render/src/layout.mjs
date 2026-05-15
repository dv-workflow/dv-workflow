const SEVERITY_STYLES = {
  critical: { bg: '#dc2626', fg: '#ffffff', label: 'CRITICAL' },
  warning: { bg: '#f59e0b', fg: '#1f2937', label: 'WARNING' },
  suggestion: { bg: '#3b82f6', fg: '#ffffff', label: 'SUGGESTION' },
};

const CARD_WIDTH = 1200;
const PAD_X = 32;
const CODE_FONT_SIZE = 14;
const CODE_LINE_HEIGHT = 1.5;
const MAX_CODE_LINES = 50;

/**
 * Build a satori-compatible vDOM tree for a single finding card.
 *
 * @param {object} args
 * @param {object} args.finding - validated manifest finding
 * @param {{tokens: Array, fg: string, bg: string}} args.themed - output of highlightTokens()
 * @returns {object} satori vDOM tree
 */
export function buildCard({ finding, themed }) {
  const sev = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.warning;
  const startLine = finding.location?.line_start || 1;
  const tokenLines = (themed.tokens || []).slice(0, MAX_CODE_LINES);
  const truncated = (themed.tokens || []).length > MAX_CODE_LINES;

  const codeBlock = tokenLines.length > 0 ? {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        padding: `20px ${PAD_X}px`,
        backgroundColor: themed.bg,
        color: themed.fg,
        fontFamily: 'Code',
        fontSize: CODE_FONT_SIZE,
        lineHeight: CODE_LINE_HEIGHT,
      },
      children: [
        ...tokenLines.map((line, i) => ({
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'row' },
            children: [
              {
                type: 'span',
                props: {
                  style: {
                    color: '#6b7280',
                    width: 56,
                    paddingRight: 16,
                    textAlign: 'right',
                    flexShrink: 0,
                  },
                  children: String(startLine + i),
                },
              },
              ...(line.length === 0
                ? [{ type: 'span', props: { children: ' ' } }]
                : line.map((tok) => ({
                    type: 'span',
                    props: {
                      style: { color: tok.color || themed.fg, whiteSpace: 'pre' },
                      children: tok.content || ' ',
                    },
                  }))),
            ],
          },
        })),
        truncated ? {
          type: 'div',
          props: {
            style: { color: '#6b7280', fontStyle: 'italic', paddingTop: 8 },
            children: `… ${(themed.tokens.length - MAX_CODE_LINES)} more lines truncated`,
          },
        } : null,
      ].filter(Boolean),
    },
  } : null;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: CARD_WIDTH,
        backgroundColor: '#0d1117',
        color: '#c9d1d9',
        fontFamily: 'Code',
      },
      children: [
        // Severity banner.
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: `20px ${PAD_X}px`,
              backgroundColor: sev.bg,
              color: sev.fg,
              gap: 16,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    padding: '6px 12px',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    borderRadius: 4,
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: 1,
                  },
                  children: sev.label,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 22, fontWeight: 700, flex: 1 },
                  children: truncateText(finding.title, 140),
                },
              },
            ],
          },
        },
        // Subheader.
        {
          type: 'div',
          props: {
            style: {
              padding: `12px ${PAD_X}px`,
              backgroundColor: '#161b22',
              color: '#9ca3af',
              fontSize: 14,
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
            },
            children: [
              { type: 'span', props: { children: formatLocation(finding.location) } },
              finding.rule_ref ? { type: 'span', props: { children: `· ${finding.rule_ref}` } } : null,
            ].filter(Boolean),
          },
        },
        // Code block.
        codeBlock,
        // Body.
        finding.body ? {
          type: 'div',
          props: {
            style: {
              padding: `16px ${PAD_X}px`,
              borderTop: '1px solid #30363d',
              fontSize: 15,
              lineHeight: 1.5,
              color: '#c9d1d9',
              whiteSpace: 'pre-wrap',
            },
            children: truncateText(finding.body, 800),
          },
        } : null,
        // Fix banner.
        finding.fix ? {
          type: 'div',
          props: {
            style: {
              padding: `14px ${PAD_X}px`,
              backgroundColor: '#064e3b',
              color: '#a7f3d0',
              fontSize: 14,
              display: 'flex',
              flexDirection: 'row',
              gap: 10,
            },
            children: [
              { type: 'span', props: { style: { fontWeight: 700, color: '#34d399' }, children: 'FIX →' } },
              { type: 'span', props: { children: truncateText(finding.fix, 400) } },
            ],
          },
        } : null,
        // Footer.
        {
          type: 'div',
          props: {
            style: {
              padding: `8px ${PAD_X}px`,
              backgroundColor: '#161b22',
              color: '#6b7280',
              fontSize: 11,
            },
            children: `dw:review · finding ${finding.id}`,
          },
        },
      ].filter(Boolean),
    },
  };
}

function formatLocation(loc) {
  if (!loc) return '';
  if (loc.line_start && loc.line_end && loc.line_start !== loc.line_end) {
    return `${loc.file}:${loc.line_start}-${loc.line_end}`;
  }
  if (loc.line_start) return `${loc.file}:${loc.line_start}`;
  return loc.file || '';
}

function truncateText(s, max) {
  if (typeof s !== 'string') return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

export const CARD_LAYOUT_CONSTANTS = { CARD_WIDTH, PAD_X, CODE_FONT_SIZE, MAX_CODE_LINES };
