import chalk from 'chalk';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export const BANNER = `
  ██████╗ ██╗    ██╗   ██╗  ██╗██╗████████╗
  ██╔══██╗██║    ██║   ██║ ██╔╝██║╚══██╔══╝
  ██║  ██║██║ █╗ ██║   █████╔╝ ██║   ██║
  ██║  ██║██║███╗██║   ██╔═██╗ ██║   ██║
  ██████╔╝╚███╔███╔╝   ██║  ██╗██║   ██║
  ╚═════╝  ╚══╝╚══╝    ╚═╝  ╚═╝╚═╝   ╚═╝`;

export function banner(subtitle) {
  console.log(chalk.cyan.bold(BANNER));
  if (subtitle) console.log(chalk.cyan(`  ${subtitle}`));
  console.log();
}

export function header(text) {
  console.log();
  console.log(chalk.bold(`══════════════════════════════════════════`));
  console.log(chalk.bold(`  ${text}`));
  console.log(chalk.bold(`══════════════════════════════════════════`));
}

export const log = (msg) => console.log(`  ${msg}`);
export const ok = (msg) => console.log(chalk.green(`  ✓  ${msg}`));
export const warn = (msg) => console.log(chalk.yellow(`  ⚠  ${msg}`));
export const err = (msg) => console.log(chalk.red(`  ✗  ${msg}`));
export const info = (msg) => { console.log(); console.log(chalk.cyan(`▶ ${msg}`)); };
export const dry = (msg) => console.log(chalk.dim(`  [dry-run] ${msg}`));

export async function ask(question, defaultValue) {
  const rl = createInterface({ input: stdin, output: stdout });
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  try {
    const answer = await rl.question(chalk.bold(`  ${question}${suffix}: `));
    return answer.trim() || defaultValue || '';
  } finally {
    rl.close();
  }
}

export async function choose(question, options, defaultValue) {
  console.log(chalk.bold(`  ${question}`));
  for (const opt of options) {
    const marker = opt.value === defaultValue ? chalk.cyan(' [default]') : '';
    console.log(`    ${opt.value} = ${opt.label}${marker}`);
  }
  const allowed = new Set(options.map((o) => o.value));
  while (true) {
    const answer = await ask('>', defaultValue);
    if (allowed.has(answer)) return answer;
    warn(`Invalid choice: "${answer}". Allowed: ${[...allowed].join(', ')}`);
  }
}

export async function multiSelect(question, options, defaultValues) {
  console.log(chalk.bold(`  ${question}`));
  for (const opt of options) {
    const marker = defaultValues?.includes(opt.value) ? chalk.dim(' (included)') : '';
    console.log(`    ${opt.key} = ${opt.label}${marker}`);
  }
  const hint = defaultValues ? defaultValues.join(',') : '';
  return ask('Enter numbers separated by comma', hint);
}
