# Module: src/commands

## Vai trò
6 CLI commands tạo nên toàn bộ giao diện user của dw-kit CLI. Mỗi command là 1 file độc lập, orchestrate logic từ `src/lib/`.

## Files chính

| File | Command | Vai trò | Lines |
|------|---------|---------|-------|
| `init.mjs` | `dw init` | Setup wizard — init dw-kit cho project mới | 332 |
| `upgrade.mjs` | `dw upgrade` | So sánh và upgrade toolkit files | 262 |
| `claude-vn-fix.mjs` | `dw claude-vn-fix` | Patch Vietnamese IME bug trong Claude Code | 267 |
| `prompt.mjs` | `dw prompt` | Autocomplete + wizard build structured prompt | 125 |
| `doctor.mjs` | `dw doctor` | Health check — validate config + file structure | 149 |
| `validate.mjs` | `dw validate` | Validate dw.config.yml schema | 102 |

## Public API / Exports

Mỗi file export 1 async function:
- `init.mjs` → `initCommand(opts)`
- `upgrade.mjs` → `upgradeCommand(opts)`
- `claude-vn-fix.mjs` → `claudeVnFixCommand(opts)`
- `prompt.mjs` → `promptCommand(opts, cmd)`
- `doctor.mjs` → `doctorCommand(opts)`
- `validate.mjs` → `validateCommand(opts)`

## Presets của `init`

```js
const PRESETS = {
  'solo-quick':  { depth: 'quick',     roles: ['dev'],                              tracking: false },
  'small-team':  { depth: 'standard',  roles: ['dev', 'techlead'],                  tracking: true  },
  'enterprise':  { depth: 'thorough',  roles: ['dev', 'techlead', 'ba', 'qc', 'pm'],tracking: true  },
};
```

## Dependencies

- **Upstream**: `src/cli.mjs` — đăng ký và gọi các commands
- **Downstream (lib)**:
  - `config.mjs` — load/write YAML config
  - `copy.mjs` — copy template dirs
  - `ui.mjs` — interactive prompts, colored output
  - `platform.mjs` — OS detection
  - `clipboard.mjs` — copy to clipboard (prompt command)
  - `prompt-suggest.mjs` — autocomplete suggestions

## Conventions riêng

- Guard clause ở đầu: kiểm tra file tồn tại trước khi thực hiện
- `opts` parameter từ commander.js — options từ CLI flags
- Interactive prompts dùng `ask()` và `choose()` từ `ui.mjs`

## Lưu ý cho AI

- `init.mjs` copy files từ `project-templates/` vào project của user — path resolution dùng `import.meta.url`
- `upgrade.mjs` so sánh checksum để detect changes — không overwrite customizations của user
- `claude-vn-fix.mjs` modify Claude Code settings JSON trực tiếp — OS-specific paths
- `TOOLKIT_ROOT` constant trong mỗi command trỏ đến root của dw-kit package
