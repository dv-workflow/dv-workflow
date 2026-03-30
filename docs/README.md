# dw-kit Docs (v1)

Tài liệu sử dụng cho `dw-kit` bản `v1.x`.

## Bắt Đầu Nhanh

1) Cài CLI:

```bash
npm install -g dw-kit
```

2) Khởi tạo trong project:

```bash
dw init
```

3) Kiểm tra:

```bash
dw validate
dw doctor
```

## Commands chính

- `dw init`: setup workflow, config, adapters.
- `dw upgrade`: cập nhật toolkit files (override-aware).
- `dw validate`: validate `.dw/config/dw.config.yml` theo schema.
- `dw doctor`: health check cài đặt.
- `dw prompt`: build structured task prompt (autocomplete + wizard).
- `dw claude-vn-fix`: patch Vietnamese IME bug trong Claude CLI.

## Config chuẩn v1

File chính: `.dw/config/dw.config.yml`

Các key quan trọng:

- `workflow.default_depth`: `quick | standard | thorough`
- `team.roles`: `dev, techlead, ba, qc, pm`
- `quality.test_command`, `quality.lint_command`
- `tracking.estimation`, `tracking.log_work`
- `claude.mcp`: MCP servers

## Depth model (thay cho level cũ)

- `quick`: task nhỏ, hotfix, module quen.
- `standard`: feature thông thường cho team nhỏ.
- `thorough`: thay đổi lớn (API/DB/security), cần review/test chặt.

`workflow.default_depth` chỉ là mặc định. Khi làm task cụ thể, có thể override depth theo scope/risk thực tế (ghi trong task context).

## Runtime structure

```
.dw/
├── tasks/
├── docs/
├── metrics/
└── reports/
```

## Liên kết

- Root guide: `README.md`
- Quick reference: `docs/cheatsheet.md`
- Custom skills: `docs/custom-skills.md`
