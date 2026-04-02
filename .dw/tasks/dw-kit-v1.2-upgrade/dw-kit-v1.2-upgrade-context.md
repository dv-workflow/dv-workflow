# Context: dw-kit-v1.2-upgrade

## Ngày khảo sát: 2026-04-02
## Người thực hiện: huydv + agent

---

## Yêu Cầu Gốc

> Nâng cấp DW-kit lên phiên bản v1.2 dựa trên phân tích so sánh 4 toolkits: spec-kit, superpowers, claudekit, và DW-kit hiện tại.
> Mục tiêu: Học những gì tốt nhất từ mỗi toolkit và tích hợp vào DW, giữ vững unique strengths (config-driven, multi-role, depth routing, escape hatch), đồng thời giải quyết các điểm yếu cốt lõi.
>
> Epic này sẽ được làm đan xen, liên tục, tận dụng tối đa ClaudeCode agents.

## Phân Tích Comparative (từ dw-thinking session)

### Nguồn tham khảo đã nghiên cứu
- **spec-kit** (github.com/github/spec-kit): Spec-driven development, 50k+ stars
- **superpowers** (claude.com/plugins/superpowers): TDD enforcement + parallel agents, 294k installs
- **claudekit** (claudekit.cc + /projects-refer/claudekit-engineer-main): 14 agents + 47+ skills + hooks engineering, 4k users

### Điểm yếu cần giải quyết (gap analysis)

| Gap | Mức độ | Học từ |
|-----|--------|--------|
| No parallel agent execution | Critical | Superpowers + Claudekit |
| Skills chỉ là markdown prompts (no enforcement) | Critical | Claudekit hooks |
| Session amnesia giữa conversations | High | Claudekit session-init |
| No file-based agent communication | High | Claudekit reports protocol |
| Doc staleness không auto-detect | Medium | Claudekit docs-manager |
| No scout/privacy protection hooks | Medium | Claudekit |
| Socratic task kickoff thiếu | Medium | Superpowers brainstorm |
| Zero community/discoverability | Low | (long-term) |

### Điểm mạnh cần bảo vệ (không được mất)

- Config-driven adaptability (YAML per project) — DW unique
- Multi-role workflow (BA/QC/PM/TechLead) — DW unique
- Depth routing (quick/standard/thorough) — DW unique
- Task documentation lifecycle (context → plan → progress → archive) — DW unique
- --no-dw escape hatch — DW unique
- Thinking framework built-in — DW unique
- Free + internal tool — không cần commercial model

## Codebase Analysis

### Files Liên Quan

| # | File/Dir | Vai trò | Cần thay đổi? | Ghi chú |
|---|----------|---------|----------------|---------|
| 1 | `src/cli.mjs` | CLI entry point | Có thể | Thêm hooks commands |
| 2 | `src/commands/init.mjs` | dw init command | Có | Thêm hook templates |
| 3 | `.claude/skills/` | Tất cả skills | Có | Refactor + thêm mới |
| 4 | `.claude/hooks/` | Hooks hiện tại | Có | Thêm scout/privacy/session-init |
| 5 | `.claude/templates/` | Task templates | Có | Cập nhật plan/progress templates |
| 6 | `CLAUDE.md` | Core instructions | Có | Cập nhật routing + new features |
| 7 | `core/WORKFLOW.md` | Methodology | Có | Thêm parallel execution patterns |
| 8 | `.dw/config/dw.config.yml` | Config template | Có | Thêm v1.2 options |
| 9 | `.claude/agents/` | Agent definitions | Tạo mới | Hiện chưa có |
| 10 | `package.json` | NPM package | Có | Version bump |

### Kiến Trúc Hiện Tại

```
User → Claude Code → CLAUDE.md (routing)
              ↓
       /skill-name → .claude/skills/[name]/SKILL.md (markdown prompt)
              ↓
       Agent thực thi (sequential, single agent)
              ↓
       .dw/tasks/[name]/ (context + plan + progress)
```

### Kiến Trúc Mục Tiêu v1.2

```
User → Claude Code → CLAUDE.md (routing + depth assessment)
              ↓
       /skill-name → .claude/skills/[name]/SKILL.md
              ↓                          ↓
       Hooks (session-init,      Parallel subagents
       scout-block, privacy)     (via Agent tool)
              ↓                          ↓
       File-based reports ←─────────────┘
       .dw/tasks/[name]/reports/
              ↓
       .dw/tasks/[name]/ (lifecycle docs)
              ↓
       Post-execution hooks (docs-check, quality gates)
```

## Dependencies

### Upstream
- Claude Code CLI: phải support agents, hooks, skills format hiện tại
- `claudekit-engineer-main`: reference implementation cho hooks + agent patterns

### Downstream
- 2 dev teams (~10 devs) đang dùng DW: phải backward compatible
- Existing tasks in `.dw/tasks/`: không được break

## Patterns & Conventions Phát Hiện

| Pattern | Mô tả | Nguồn |
|---------|--------|-------|
| File-based reports | `from-[agent]-to-[agent]-[desc].md` với status codes | Claudekit |
| Hook YAML frontmatter | Agent definitions với tools/model/memory | Claudekit |
| Scout-block pattern | Block heavy dirs qua hooks | Claudekit |
| Depth routing | quick/standard/thorough per-task assessment | DW (giữ) |
| Skill as markdown | YAML frontmatter + instruction body | DW (giữ) |

## Giả Định

| # | Giả định | Cần kiểm chứng? | Nếu sai thì sao? |
|---|----------|-----------------|-------------------|
| 1 | Claude Code support `.claude/agents/` format như claudekit | Có — test ngay | Phải dùng subagent type khác |
| 2 | Hooks CJS format tương thích với dw-kit setup | Có | Cần convert sang mjs |
| 3 | Teams 10 devs có thể absorb v1.2 upgrade không breaking | Có | Cần migration guide |
| 4 | Parallel agents không gây race condition trên `.dw/tasks/` | Có | Cần file locking |

## Hạn Chế Đã Biết

- Claude Code không có built-in enforcement mechanism cho skills (fundamental limitation)
- File-based communication tốt nhưng cần directory conventions rõ ràng
- Parallel agents trong một conversation có thể conflict nếu write cùng file
- Upgrade phải backward compatible — existing tasks không được break

## Chưa Rõ / Cần Làm Rõ

- [ ] Claude Code agents folder format chính xác (`.claude/agents/` vs subagent_type) — test ngay ST-1
- [ ] Hooks trong dw-kit có chạy được CJS không hay cần convert? — check `stop-check.sh` pattern
- [ ] Reports protocol: dw nên dùng `.dw/tasks/[name]/reports/` hay `.claude/` level? — design decision
- [ ] Có cần v1.2 config schema để differentiate từ v1? — backward compat concern

## Ghi Chú Bổ Sung

**Nguồn tham khảo chính:**
- `/projects-refer/claudekit-engineer-main/.claude/hooks/` — scout-block, privacy-block, session-init pattern
- `/projects-refer/claudekit-engineer-main/.claude/agents/` — agent YAML frontmatter format
- `/projects-refer/claudekit-engineer-main/.claude/rules/orchestration-protocol.md` — file-based communication

**Strategy:**
- Không phải rewrite toàn bộ — enhance từng layer incrementally
- Mỗi subtask phải có acceptance criteria đo được + verify được
- Ưu tiên hooks (no-code enforcement) trước skills (markdown-based)
