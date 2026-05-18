# Commit Standards

## Format

```
<type>(<scope>): <imperative English subject ≤72 chars>

[Optional body — explain WHY, wrap at 72 chars]

[Optional footer — BREAKING CHANGE: ..., Refs: #123]
```

**English only.** Use imperative mood: `add user auth`, `fix login redirect`, `update API client` — never `added`, `fixes`, or past tense.

**Do not append `Co-Authored-By: Claude` or any AI signature.** Commits are authored by the human who reviewed and shipped them.

## Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Restructure without behavior change |
| `test` | Add or update tests |
| `docs` | Documentation, comments |
| `chore` | Build, config, dependencies |
| `style` | Format, whitespace (no logic change) |
| `perf` | Performance improvement |

## Rules

- One commit = one subtask or one complete logical unit
- Subject ≤72 chars; body wrapped at 72
- Imperative present tense (`add`, `fix`, `update` — not `added`, `fixed`, `updates`)
- Never commit secrets (`.env`, credentials, tokens)
- Never commit leftover `console.log`, `debugger`, etc.

## Branch Naming

```
<type>/<task-name>
```

Examples: `feat/user-auth`, `fix/login-redirect`, `refactor/api-structure`

## Localization Override

This convention defaults to English to match the global open-source norm. A team that ships only in another language MAY override this rule in their own project by editing this file — but the toolkit itself ships English-default templates.
