import { header, info, ok, warn, err, log } from '../lib/ui.mjs';
import { copyToClipboard } from '../lib/clipboard.mjs';
import { getSuggestions, isVague, expandTemplate } from '../lib/prompt-suggest.mjs';
import { detectPlatform } from '../lib/platform.mjs';

export async function promptCommand(opts) {
  header('dw-kit Prompt Builder');

  const adapter = detectPlatform(process.cwd());

  // Non-interactive mode: --text <text>
  if (opts.text !== undefined) {
    if (!opts.text.trim()) {
      err('--text cannot be empty.');
      process.exit(1);
    }
    const result = await buildPrompt(opts.text, { interactive: false });
    outputResult(result, adapter);
    return;
  }

  // Interactive mode
  const result = await buildPrompt('', { interactive: true });
  outputResult(result, adapter);
}

async function buildPrompt(initialText, { interactive }) {
  let description = initialText;

  if (interactive) {
    description = await runAutocompleteStep();
    if (!description.trim()) {
      err('No description provided.');
      process.exit(1);
    }
  }

  let area = '';
  let outcome = '';

  if (isVague(description)) {
    if (interactive) {
      info('Description seems short — a couple of quick questions (Enter to skip):');
      ({ area, outcome } = await runWizardStep());
    }
    // In non-interactive mode: expand with just the description (no wizard data)
  }

  return expandTemplate(description, { area, outcome });
}

async function runAutocompleteStep() {
  const { AutoComplete } = await import('enquirer');
  const suggestions = getSuggestions(process.cwd());

  const prompt = new AutoComplete({
    name: 'description',
    message: 'Describe your task:',
    limit: 7,
    choices: suggestions.length ? suggestions : ['(no suggestions — type your task)'],
    suggest(typed, choices) {
      const lower = typed.toLowerCase();
      const filtered = choices.filter((c) => c.message.toLowerCase().includes(lower));
      // Always offer the raw typed text as first selectable option
      if (typed && !filtered.find((c) => c.message === typed)) {
        return [{ message: typed, value: typed }, ...filtered];
      }
      return filtered.length ? filtered : [{ message: typed || '(empty)', value: typed }];
    },
  });

  return prompt.run();
}

async function runWizardStep() {
  const { Input } = await import('enquirer');

  const area = await new Input({
    name: 'area',
    message: 'Which area/files? (e.g. auth middleware, src/login/)',
    initial: '',
  }).run().catch(() => '');

  const outcome = await new Input({
    name: 'outcome',
    message: 'Expected outcome? (e.g. user redirected to /dashboard)',
    initial: '',
  }).run().catch(() => '');

  return { area, outcome };
}

function outputResult(text, adapter) {
  log('');
  log('─── Result ───────────────────────────────────────────');
  log(text);
  log('──────────────────────────────────────────────────────');
  log('');

  const shouldCopy = adapter === 'claude-cli' || adapter === 'cursor';
  if (shouldCopy) {
    const copied = copyToClipboard(text);
    if (copied) {
      ok('Copied to clipboard. Paste into Claude CLI or your IDE.');
    } else {
      warn('Clipboard copy failed. Copy the text above manually.');
    }
  } else {
    // generic adapter: just output to stdout
    info('(generic adapter — copy the text above manually)');
  }
}
