---
name: dw:config-validate
description: "Kiểm tra .dw/config/dw.config.yml có hợp lệ không. Phát hiện unknown keys, typos, invalid values. Chạy sau khi sửa config thủ công."
argument-hint: ""
---

# Validate Config

Kiểm tra `.dw/config/dw.config.yml` trong project hiện tại.

## Bước 1: Đọc config

Đọc toàn bộ `.dw/config/dw.config.yml`.

## Bước 2: Kiểm tra top-level keys

**Known top-level keys:**
```
project, level, team, flags, routing, estimation, metrics, paths
```

Nếu có key nào khác → **WARN**: "Unknown top-level key: `[key]` — có thể là typo?"

## Bước 3: Kiểm tra `flags` keys

**Known flag keys:**
```
research, plan, execute, commit, review, debug,
living_docs, docs_update_on_commit,
estimation, log_work, metrics_tracking, dora_metrics,
pre_commit_tests, pre_commit_lint, block_commit_on_fail,
handoff, thinking_framework,
requirements_skill, test_plan_skill, arch_review_skill, dashboard_skill
```

Nếu có flag key nào khác → **WARN**: "Unknown flag: `[key]` — có thể là typo? Flag này sẽ bị ignore."

## Bước 4: Kiểm tra flag values

Mỗi flag phải có giá trị `true`, `false`, hoặc `"skip"`.
Nếu giá trị khác → **ERROR**: "Flag `[key]` có giá trị không hợp lệ: `[value]`. Phải là true | false | \"skip\"."

## Bước 5: Kiểm tra `level`

- Phải là `1`, `2`, hoặc `3`.
- Nếu `level: 3` → **INFO**: "Level 3 đang ở beta — living docs automation, DORA auto-calculation, và dashboard HTML export chưa fully implemented."

## Bước 6: Kiểm tra `project.language`

- Phải là `"vi"` hoặc `"en"`.
- Nếu `"en"` → kiểm tra `.claude/templates/en/` có tồn tại không. Nếu không → **WARN**: "English templates chưa có. Chạy `/dw:upgrade` để lấy templates mới nhất."

## Bước 7: Báo cáo kết quả

```
=== Config Validation Report ===

File: .dw/config/dw.config.yml
Project: [project.name]
Level: [level]
Language: [language]

ERRORS (phải fix):
  [danh sách lỗi nếu có]

WARNINGS (nên xem xét):
  [danh sách warnings nếu có]

INFO:
  [thông tin thêm]

[OK] Config hợp lệ  /  [FAIL] Có X error(s) cần fix
```

Nếu không có lỗi: "Config hợp lệ. X flags đang bật, Y flags đang tắt."
