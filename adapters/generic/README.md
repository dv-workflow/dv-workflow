# Generic Adapter

Dành cho bất kỳ AI coding assistant nào (Cursor, Windsurf, Copilot, etc.).

## Cách dùng

1. Copy `AGENT.md` vào project root
2. Copy `config/dw.config.yml` và điền settings
3. Tạo `.dw/tasks/` directory

## Limitations

Generic adapter cung cấp **methodology** (what to do), không phải **execution** (how Claude Code does it).

Không có:
- Agent delegation với tool constraints
- Pre-commit hooks (safety-guard, quality gates)
- MCP server integration
- Automatic context management

Muốn full capabilities → dùng Claude Code với Claude CLI adapter.
