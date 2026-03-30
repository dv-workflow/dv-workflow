# Module: src/lib

## Vai trò
Shared utilities dùng bởi tất cả commands. Không có business logic — chỉ là thin wrappers và helpers.

## Files chính

| File | Vai trò | Lines |
|------|---------|-------|
| `config.mjs` | Load/write/build YAML config (`dw.config.yml`) | 75 |
| `copy.mjs` | File/dir copy, ensureDir — dùng trong init/upgrade | 110 |
| `ui.mjs` | CLI output: `ok`, `warn`, `info`, `log`, `ask`, `choose`, `banner` | 66 |
| `platform.mjs` | OS detection: `detectPlatform()`, `platformLabel()` | 39 |
| `clipboard.mjs` | Copy text to clipboard (cross-platform) | 24 |
| `prompt-suggest.mjs` | Autocomplete suggestions cho `dw prompt` command | 84 |
| `update-checker.mjs` | Check npm registry cho new version, notify user | 73 |

## Public API / Exports

**config.mjs**:
- `loadConfig(configPath)` → parsed YAML object | null
- `writeConfig(configPath, data)` → void
- `loadSchema(schemaPath)` → parsed JSON | null
- `buildConfig({ projectName, language, depth, roles })` → config object

**ui.mjs**:
- `banner(text)`, `ok(text)`, `warn(text)`, `info(text)`, `log(text)`
- `ask(question, defaultVal)` → Promise\<string\>
- `choose(question, choices, defaultVal)` → Promise\<string\>

**copy.mjs**:
- `copyDir(src, dest, options)` → void
- `copyFile(src, dest)` → void
- `ensureDir(path)` → void

**platform.mjs**:
- `detectPlatform()` → `'win32' | 'darwin' | 'linux'`
- `platformLabel()` → human-readable string

## Dependencies

- **Upstream**: `src/commands/*` — tất cả commands import từ lib
- **External packages**: `js-yaml`, `inquirer` (ui.mjs), `chalk` (ui.mjs)
- **Node built-ins**: `fs`, `path`, `os`, `child_process`

## Conventions riêng

- Pure functions — không có side effects ngoài file I/O được documented
- `config.mjs` không validate schema — chỉ parse YAML

## Lưu ý cho AI

- `update-checker.mjs` gọi npm registry qua HTTPS — có thể slow/fail nếu offline
- `clipboard.mjs` dùng platform-specific commands (`clip` win32, `pbcopy` darwin, `xclip` linux) — wrap trong try/catch
- `buildConfig()` trong `config.mjs` generate toàn bộ default config structure — là source of truth cho config schema
