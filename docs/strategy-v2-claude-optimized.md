# dw-kit v2 — Claude-Optimized Strategy Supplement

> **Status**: Supplement cho `plan-v2-flexible-first.md`
> **Ngày**: 2026-03-23
> **Mục đích**: Điều chỉnh kiến trúc v2 để tận dụng tối đa Claude Code capabilities mà không hy sinh tính flexible/portable của core

---

## Nguyên Tắc Bổ Sung

> **"Portable methodology, Claude-maximized execution."**

Plan v2 đúng khi tách methodology khỏi platform syntax.
Nhưng "portable core" không có nghĩa là "dumb execution layer."
Claude adapter phải là layer giàu nhất, tận dụng mọi thứ Claude Code có thể làm.

**Tension cần giải quyết:**
```
Portability ←──────────────────→ Claude-Optimization
[core/WORKFLOW.md]           [adapters/claude-cli/]
generic, stable              rich, Claude-specific
```

Giải pháp: Phân tầng rõ ràng. Portable core ≠ thin execution layer.

---

## Kiến Trúc 4 Lớp (Thay Thế 2-Layer Adapter System)

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Extension Layer  (team overrides + custom)    │
│  .claude/overrides/ + .claude/extensions/               │
│  ─── KHÔNG BAO GIỜ bị overwrite khi upgrade ───        │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Capability Layer  (Claude model-specific)     │
│  extended thinking · structured output · MCP config     │
│  ─── upgrade độc lập, additive only ───                 │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Platform Layer   (Claude Code execution)      │
│  agents · hooks · skill shells · settings.json          │
│  ─── upgrade với compatibility check ───                │
├─────────────────────────────────────────────────────────┤
│  Layer 0: Methodology Core  (platform-agnostic)         │
│  WORKFLOW.md · THINKING.md · QUALITY.md · ROLES.md      │
│  ─── stable, versioned, human-readable ───              │
└─────────────────────────────────────────────────────────┘
```

Mỗi layer có:
- Version độc lập
- Upgrade path độc lập
- Interface contract với layer liền kề

---

## Layer 0: Methodology Core (Điều Chỉnh Nhỏ)

Plan v2 đề xuất 4 files — giữ nguyên, thêm 2 convention:

### Section Anchors Chuẩn Hóa

Mỗi phase trong WORKFLOW.md dùng HTML comment anchor:
```markdown
<!-- @phase:initialize -->
## Phase 1: Initialize
...
<!-- @phase:understand -->
## Phase 2: Understand
...
```

Mục đích: Skills ở Layer 1 reference section cụ thể thay vì load toàn bộ file.

### Version Header

```markdown
<!-- core-version: 2.0 -->
<!-- last-updated: 2026-03-23 -->
# dw-kit Workflow Methodology
```

### Loading Rule (QUAN TRỌNG)

**WORKFLOW.md KHÔNG ĐƯỢC load vào always-loaded context (CLAUDE.md).**

CLAUDE.md giữ ngắn (~150 lines). Skills tự load context khi được invoke.
Đây là thiết kế đúng của v0.3 hiện tại — cần giữ, không phá vỡ.

```
CLAUDE.md (always loaded)     ~150 lines  → routing + skill index
Skill SKILL.md (on-demand)    ~100 lines  → skill instructions
core/WORKFLOW.md              ~3000 lines → reference only, loaded khi cần
```

---

## Layer 1: Platform Layer — Enhanced Claude Code Execution

Đây là nơi Claude Code capabilities được khai thác triệt để.
**Không simplify layer này vì "portability" — đây là competitive moat.**

### 1.1 Enhanced Agent System

Giữ 4 agents hiện tại (researcher/planner/reviewer/quality-checker).
Thêm 1 agent mới. Enhance từng agent:

#### `researcher` — thêm diagnostics
```yaml
---
name: researcher
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - mcp__ide__getDiagnostics   # ← THÊM: detect linting errors trong scope
---
```
Output thêm `confidence` level cho mỗi finding:
```
- **Finding**: auth module dùng MD5 for password hashing [auth/service.ts:42]
  **Confidence**: HIGH (đọc trực tiếp source)
  **Impact**: CRITICAL
```

#### `planner` — kích hoạt deep reasoning
Thêm instruction block vào planner.md:
```markdown
## Deep Analysis Protocol (BẮT BUỘC cho thorough depth)

Trước khi viết plan, hãy thực hiện phân tích sâu:

1. **Liệt kê ≥3 approaches khả thi** — kể cả các approach không obvious
2. **Với mỗi approach**: xác định assumptions, failure modes, trade-offs
3. **Devil's advocate**: lý do mạnh nhất để KHÔNG chọn approach bạn đang nghiêng về
4. **Chỉ sau khi đã exhaust các góc nhìn**, mới chọn approach và viết plan

Đây không phải ceremony — đây là cơ chế để tránh tunnel vision.
```

Model config: planner dùng model mạnh nhất available (configurable via Layer 2).

#### `reviewer` — structured + human output song song

Giữ output markdown hiện tại. Thêm JSON block ở cuối để CI/CD parse:
```markdown
## Machine-Readable Summary
\`\`\`json
{
  "approved": false,
  "score": 7.5,
  "critical": [
    {"file": "auth/service.ts", "line": 42, "issue": "MD5 password hashing", "fix": "bcrypt minimum rounds 12"}
  ],
  "warnings": [...],
  "suggestions": [...]
}
\`\`\`
```

Không thay thế markdown — bổ sung thêm. Human đọc markdown, CI đọc JSON.

#### `executor` — NEW agent với worktree isolation

```yaml
---
name: executor
description: "Thực hiện implementation theo plan đã approve. Có thể chạy trong isolated worktree."
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
disallowedTools:
  - NotebookEdit
model: inherit
---
```

Khi `worktree_execution: true` trong config → execute skill spawn executor agent với
`isolation: "worktree"` parameter. Changes trong worktree không ảnh hưởng main branch
cho đến khi developer approve merge.

Dùng cho: refactors lớn, migrations, thay đổi có risk cao.

### 1.2 Enhanced Hook System

Settings.json hiện tại có 2 hooks (PreToolUse/Bash và Stop).
Mở rộng thành 4 loại:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/pre-commit-gate.sh\""
        }]
      },
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/safety-guard.sh\""
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/post-write.sh\""
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "prompt",
          "prompt": "..."
        }]
      }
    ],
    "Notification": [
      {
        "hooks": [{
          "type": "command",
          "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/progress-ping.sh\""
        }]
      }
    ]
  }
}
```

**Mỗi hook mới làm gì:**

`safety-guard.sh` — intercept destructive commands:
```bash
# Block trước khi execute:
# - rm -rf / hoặc rm -rf * (không có path cụ thể)
# - git push --force (yêu cầu confirm)
# - DROP TABLE, DELETE FROM (không có WHERE)
# exit 2 = block, exit 0 = allow
```

`post-write.sh` — auto-quality check sau khi write file:
```bash
# Nếu test_command configured + file là source code:
#   Chạy test liên quan đến file vừa thay đổi (jest --findRelatedTests, pytest <file>)
# Nếu lint_command configured:
#   Chạy lint trên file vừa thay đổi
# Output warnings, không block (exit 0)
```

`progress-ping.sh` — nhận biết khi task dài hoàn thành:
```bash
# Đọc active task từ .dw/tasks/
# Nếu có task đang in-progress → remind cập nhật progress file
# Non-blocking, informational only
```

### 1.3 Skill Shell Structure (Reference Injection Pattern)

Skill files trong Layer 1 theo pattern: metadata + Claude execution + methodology reference.

```markdown
---
name: dw-plan
description: "..."
argument-hint: "[task-name]"
allowed-tools: [Read, Grep, Glob, Write, Agent]
model: claude-opus-4-6    # override từ Layer 2 config
---

# Plan: $ARGUMENTS

## Setup
[đọc config, validate context đã có]

## Execution
[Claude Code-specific: agent delegation, tool constraints]
Delegate to planner agent:
> Agent(subagent_type="planner", prompt="...")

## Methodology Reference
Áp dụng phases từ core/WORKFLOW.md#phase:plan
```

Skill biết cách chạy (platform layer). WORKFLOW.md biết workflow là gì (core layer).
Tách biệt rõ ràng — upgrade core không break skill shells.

---

## Layer 2: Capability Layer (MỚI)

Layer này không tồn tại trong v0.3 hay plan v2 draft.
Nó là nơi Claude model-specific features được cấu hình.

### Config Section Mới trong `dw.config.yml`

```yaml
# --- Claude Capabilities --------------------------------------------------------
claude:
  # Model selection per phase (để trống = inherit từ Claude Code settings)
  models:
    plan: "claude-opus-4-6"         # thorough analysis cần model mạnh nhất
    execute: "claude-sonnet-4-6"    # balance speed/quality cho execution
    review: "claude-sonnet-4-6"
    research: "claude-sonnet-4-6"
    # quick tasks: luôn dùng default (không override)

  # Extended thinking — khuyến khích deep reasoning trong planning
  deep_reasoning:
    enabled: true
    phases: ["plan", "arch-review"]   # chỉ thorough phases cần deep analysis
    # Note: không phải API parameter — là instruction pattern trong skill

  # Structured output — JSON machine-readable artifacts
  structured_output:
    enabled: true
    artifacts: ["review", "estimate", "quality-check"]  # skills nào output JSON

  # Worktree isolation cho risky operations
  worktree_execution: false           # true = executor agent chạy trong worktree

  # MCP servers (Claude Code native)
  mcp: []
  # Ví dụ:
  # mcp:
  #   - name: "jira"
  #     command: "npx @anthropic/mcp-server-jira"
  #     env: { JIRA_URL: "...", JIRA_TOKEN: "..." }
```

### Tại Sao Cần Layer Này?

| Feature | Không có Layer 2 | Có Layer 2 |
|---------|-----------------|------------|
| Model selection | Hard-coded trong agent files | Config-driven, dễ upgrade khi model mới ra |
| Deep reasoning | Không có, planner dùng default | Explicit instruction pattern per phase |
| JSON output | Manual, inconsistent | Config flag, uniform schema |
| Worktree isolation | Phải sửa skill file | Toggle trong config |
| MCP servers | Phải sửa settings.json tay | Declarative trong config, adapter generates settings.json |

### Adapter Generates settings.json từ Config

Một trong những win lớn nhất: setup.sh đọc `dw.config.yml → claude.mcp[]` và
generate `.claude/settings.json` với đúng `mcpServers` block. User không cần
biết settings.json format — chỉ cần khai báo trong config.

---

## Layer 3: Extension Layer — Upgrade-Safe Customizations

Đây là giải pháp cho breaking change lớn nhất của plan v2:
"adapter regeneration sẽ overwrite customizations của user."

### Directory Structure

```
adapters/claude-cli/
├── generated/              # AUTO-GENERATED — không edit tay
│   ├── skills/             # generated skill shells từ WORKFLOW.md + config
│   ├── agents/             # generated agent files
│   └── settings.json       # generated từ dw.config.yml
│
├── overrides/              # TEAM CUSTOMIZATIONS — KHÔNG BAO GIỜ overwrite
│   ├── skills/             # override bất kỳ generated skill
│   │   └── plan/SKILL.md   # ví dụ: team muốn customize plan skill
│   └── agents/
│       └── reviewer.md     # ví dụ: team muốn thêm domain-specific review rules
│
└── extensions/             # NET-NEW TEAM SKILLS — không có trong core
    └── dw-deploy/          # ví dụ: custom deployment skill
        └── SKILL.md
```

Khi `.claude/` được generate từ `adapters/claude-cli/`:
```
generated/skills/plan/SKILL.md   → .claude/skills/plan/SKILL.md
overrides/skills/plan/SKILL.md   → .claude/skills/plan/SKILL.md  (thắng!)
extensions/dw-deploy/SKILL.md    → .claude/skills/dw-deploy/SKILL.md
```

Override thắng generated. Extensions được copy nguyên xi.

### Upgrade Script Logic

```bash
# scripts/upgrade.sh
upgrade_claude_adapter() {
  # 1. Update generated/ từ new toolkit version
  generate_from_core "adapters/claude-cli/generated/"

  # 2. Apply overrides (overrides thắng generated)
  for override in adapters/claude-cli/overrides/**; do
    target=".claude/${override#adapters/claude-cli/overrides/}"
    cp "$override" "$target"
    log "Applied override: $target"
  done

  # 3. Copy extensions (never conflict)
  rsync -a adapters/claude-cli/extensions/ .claude/skills/

  # 4. Merge settings.json (không overwrite, merge keys)
  merge_json ".claude/settings.json" "adapters/claude-cli/generated/settings.json"

  log "Upgrade complete. Overrides preserved: $(count overrides)"
}
```

---

## Loading Strategy — Ngăn Context Bloat

Đây là vấn đề kỹ thuật quan trọng nhất cần giải quyết cho v2.

### Vấn Đề

WORKFLOW.md consolidate 22 skills = ~3000+ lines.
Nếu load vào CLAUDE.md (always-loaded) → mỗi interaction tốn massive context.
Chi phí API tăng 10x. Performance giảm. Không cần thiết.

### Giải Pháp: Tiered Loading

```
Tier 1 — Always loaded (~150 lines):
  CLAUDE.md: routing rules + skill index + config reference

Tier 2 — Load on skill invocation (~100 lines per skill):
  .claude/skills/[name]/SKILL.md

Tier 3 — Load on demand (~3000 lines):
  core/WORKFLOW.md: chỉ khi skill cần reference methodology
  core/THINKING.md: chỉ khi planning hoặc debug

Tier 4 — Load by agent (~200 lines):
  .claude/agents/[name].md: chỉ khi agent được spawn
```

### CLAUDE.md Structure cho v2

```markdown
<!-- core-version: 2.0 | platform-version: 1.0 -->
# dw-kit v2

## Config
Đọc `config/dw.config.yml` trước mọi action.

## Routing
| Scope | Action |
|-------|--------|
| 1-2 files, hotfix | execute trực tiếp hoặc /dw-debug |
| 3-5 files | /dw-task-init → /dw-research → /dw-plan → approve → /dw-execute |
| 6+ files | chia sub-tasks, mỗi phần có workflow riêng |

## Session Start
1. Kiểm tra .dw/tasks/ cho active tasks
2. Đọc progress file của task đang dở (nếu có)
3. Tiếp tục từ subtask cuối

## Available Skills
(invoke theo tên — mỗi skill tự load instructions của nó)
- /dw-task [name]     — full workflow entry point
- /dw-debug [issue]   — debug workflow
- /dw-review          — code review
- /dw-commit [msg]    — smart commit
- /dw-report          — dashboard/sprint
- /dw-thinking [q]    — thinking framework
- /dw-help            — skill discovery

## Khi Cần Methodology Reference
Đọc @core/WORKFLOW.md (on-demand, không load mặc định)
```

CLAUDE.md: 150 lines. Clean. Fast. Mọi thứ load on-demand.

---

## Upgrade Contract

### Version Tracking trong Config

```yaml
# dw.config.yml — thêm section _toolkit
_toolkit:
  core_version: "2.0"
  platform_version: "1.0"
  capability_version: "1.0"
  installed: "2026-03-23"
  last_upgrade: "2026-03-23"
```

### Compatibility Matrix

```yaml
# config/compatibility.yml (trong toolkit repo)
compatibility:
  core_2.x:
    compatible_platform: ["1.x", "2.x"]
    min_platform: "1.0"
  platform_1.x:
    compatible_capability: ["1.x"]
    min_capability: "1.0"
```

Upgrade script kiểm tra trước khi apply:
```
Checking compatibility...
  core 2.1 ←→ platform 1.0: ✅ compatible
  platform 1.0 ←→ capability 1.1: ✅ compatible
Upgrading core: 2.0 → 2.1
```

Nếu incompatible:
```
⚠️  core 3.0 requires platform >= 2.0
   Current platform: 1.0
   Run: dw upgrade --layer platform first
```

### Migration Safety cho v0.3 → v2

Upgrade script cần xử lý 3 breaking changes từ review:

```bash
migrate_v03_to_v2() {
  # 1. Config rename + key mapping
  if [ -f "dv-workflow.config.yml" ] && [ ! -f "config/dw.config.yml" ]; then
    map_config "dv-workflow.config.yml" → "config/dw.config.yml"
    # level: 1 → default_depth: quick
    # level: 2 → default_depth: standard
    # level: 3 → default_depth: thorough
    # Giữ dv-workflow.config.yml như symlink trong 1 release cycle
    ln -s config/dw.config.yml dv-workflow.config.yml
    log "Config migrated. Old file kept as symlink for 1 version."
  fi

  # 2. Preserve custom skill content
  for skill_dir in .claude/skills/*/; do
    skill_name=$(basename "$skill_dir")
    if is_customized "$skill_dir/SKILL.md"; then
      cp "$skill_dir/SKILL.md" "adapters/claude-cli/overrides/skills/$skill_name/SKILL.md"
      log "Preserved customization: $skill_name → overrides/"
    fi
  done

  # 3. Warn về CI/CD references
  if grep -r "dv-workflow.config.yml" .github/ .gitlab-ci.yml 2>/dev/null; then
    log "⚠️  CI/CD references found. Update manually after migration."
  fi
}
```

---

## MCP Integration — First-Class từ Ngày 1

Không để đến v0.4. Claude Code có MCP built-in. Setup nó ngay từ đầu.

### Settings.json Template (Layer 1 generated)

```json
{
  "mcpServers": {},
  "permissions": { ... },
  "hooks": { ... }
}
```

Trống nhưng slot đã có. User thêm MCP server vào `dw.config.yml`:
```yaml
claude:
  mcp:
    - name: "github"
      command: "npx @modelcontextprotocol/server-github"
      env:
        GITHUB_TOKEN: "${GITHUB_TOKEN}"
```

Setup script generate settings.json từ config → MCP available ngay trong session.

### Skills Nhận Biết MCP

`task-init` skill: nếu GitHub MCP configured → offer tạo GitHub Issue:
```
Task docs đã tạo tại .dw/tasks/user-auth/
GitHub MCP detected. Tạo GitHub Issue cho task này? [y/N]
```

`dashboard` skill: nếu Linear/Jira MCP configured → sync metrics automatically.

---

## So Sánh Với Plan v2 Draft

| Aspect | Plan v2 Draft | Strategy Supplement |
|--------|--------------|---------------------|
| Layers | 2 (core + adapter) | 4 (core + platform + capability + extension) |
| Agent system | "adapter-generated" | Enhanced, preserved, first-class |
| Hook system | dw-quality-check.sh | 4-hook system (safety + post-write + stop + notification) |
| Model selection | không có | per-phase config (Layer 2) |
| Extended thinking | không đề cập | explicit instruction pattern for plan phase |
| JSON output | không có | reviewer + estimate + quality-check |
| Worktree execution | không có | executor agent với worktree isolation |
| WORKFLOW.md loading | unclear | tiered loading, KHÔNG always-loaded |
| Upgrade safety | "non-breaking" chung chung | overrides/ + extensions/ + migration script |
| MCP | v0.4 | from day 1, config-driven |

---

## Implementation Priority

Thứ tự recommend, gắn với Phase plan v2:

### Phase A: Core + Loading Strategy
Ưu tiên cao nhất: đảm bảo WORKFLOW.md không làm bloat context.
- `core/WORKFLOW.md` với section anchors
- `CLAUDE.md` redesign (tiered loading structure)
- Version headers

### Phase B: Layer 3 (Upgrade Safety) — TRƯỚC KHI Layer 1
Phải có overrides/ mechanism TRƯỚC KHI generate bất cứ gì.
Nếu không, bất kỳ ai customize sẽ mất khi upgrade lần đầu.
- Directory structure `adapters/claude-cli/`
- Upgrade script với migration v0.3 → v2

### Phase C: Layer 1 Enhancement
Enhance existing agents, đừng simplify.
- Reviewer JSON output
- Planner deep reasoning instructions
- safety-guard.sh + post-write.sh hooks
- Executor agent (new)

### Phase D: Config + Layer 2
- `dw.config.yml` với `claude:` section
- Setup script generates settings.json từ config (MCP slot)
- Model selection per phase

### Phase E: Adapters (từ plan Phase C)
Sau khi Layer 1/2/3 stable.
- Generic adapter (AGENT.md) — scope: methodology reference only, honest về limitations
- Cursor adapter

---

## Một Điều Không Nên Làm

> **Đừng "port" Claude agent delegation sang generic adapter.**

Researcher/planner/reviewer với `allowed-tools` constraints là capability duy nhất của Claude Code.
Generic adapter (AGENT.md) nên honest: nó cung cấp methodology, không replicate agent behavior.

Đây không phải limitation cần che giấu — đây là feature differentiation.
User chọn Claude adapter vì muốn agent delegation.
User chọn generic adapter vì muốn quick workflow docs cho bất kỳ tool nào.
Hai use cases khác nhau, không cần converge.

---

*Strategy supplement — 2026-03-23*
*Dựa trên: review 7 câu hỏi Section 11 + phân tích codebase v0.3 hiện tại*
