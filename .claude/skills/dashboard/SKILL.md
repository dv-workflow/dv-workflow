---
name: dw-dashboard
description: "Tạo báo cáo tổng hợp cho PM: trạng thái tasks, metrics DORA, effort tracking, velocity. Ghi ra file report để share."
argument-hint: "[sprint-name | period: last-week | last-month | all]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - "Bash(git log *)"
  - "Bash(git diff *)"
  - "Bash(ls *)"
---

# PM Dashboard — Báo Cáo Dự Án

Period: **$ARGUMENTS**

## Đọc Config

Đọc `dv-workflow.config.yml`:
- `flags.dashboard_skill` — nếu `false` → DỪNG
- `metrics.dora` → thresholds để so sánh
- `paths.tasks`, `paths.metrics`, `paths.reports`

## Thu Thập Dữ Liệu

### 1. Tasks Overview
```bash
ls {paths.tasks}/    # danh sách tasks
```

Đọc từng `*-progress.md` để lấy:
- Trạng thái (Not Started / In Progress / Blocked / Done)
- Subtasks done/total
- Blockers hiện tại

### 2. Git Metrics (DORA)
```bash
# Commits trong period
git log --oneline --after="[start-date]" --before="[end-date]"

# Lead time: time from first commit to merge
git log --format="%H %ad" --date=short

# Frequency
git log --format="%ad" --date=short | sort | uniq -c
```

### 3. Effort Data
Đọc `{paths.metrics}/effort-log.json` nếu có.

### 4. Quality Metrics
Đọc review reports (nếu có) để lấy:
- Critical issues found/fixed
- Test coverage trend

## Tính DORA Metrics

```
Deployment Frequency = commits merged / working days
Lead Time = avg(merge_date - first_commit_date) per feature
Change Failure Rate = (hotfixes + rollbacks) / total deploys × 100%
MTTR = avg time from incident_detected to resolved
```

So sánh với thresholds trong config và xếp loại: Elite / High / Medium / Low.

## Tính DORA Tự Động Từ Git

```bash
# Deployment frequency (commits/merges per day trong period)
git log --oneline --after="[start]" --before="[end]" | wc -l

# Lead time: trung bình từ commit đầu đến commit cuối của mỗi feature branch
git log --format="%H %ad %s" --date=iso --after="[start]"

# Change failure rate: đếm commits có message chứa "fix", "hotfix", "revert"
git log --oneline --after="[start]" | grep -iE "(hotfix|revert|fix:)" | wc -l

# MTTR: thời gian từ "fix commit" đến "hotfix commit" liền sau (nếu có)
```

Xếp loại theo thresholds trong config: `metrics.dora`.

## Tạo Report (Markdown + HTML)

Ghi ra `{paths.reports}/dashboard-[date].md` VÀ `{paths.reports}/dashboard-[date].html`:

```markdown
# Dashboard: [Project Name]
## Period: $ARGUMENTS | Generated: [date]

---

## 🎯 Tóm Tắt Nhanh (Executive Summary)

| Metric | Giá trị | Trend | Target |
|--------|---------|-------|--------|
| Tasks Done | X/Y | ↑ | |
| Velocity | Xh/week | → | |
| Blocked Tasks | X | ↓ better | 0 |
| Estimation Accuracy | X% | | >80% |

---

## 📋 Trạng Thái Tasks

| Task | Trạng thái | Progress | Blockers | ETA |
|------|-----------|----------|----------|-----|
| task-a | ✅ Done | 100% | — | — |
| task-b | 🔄 In Progress | 60% | — | [date] |
| task-c | ❌ Blocked | 30% | [mô tả] | TBD |

---

## 📊 DORA Metrics

| Metric | Giá trị | Level | Mục tiêu |
|--------|---------|-------|----------|
| Deployment Frequency | X/week | 🟡 High | Elite: daily |
| Lead Time | X days | 🟢 High | Elite: <1 day |
| Change Failure Rate | X% | 🟢 Elite | <5% |
| MTTR | X hours | 🟡 High | Elite: <1h |

> Thang điểm: 🟢 Elite | 🔵 High | 🟡 Medium | 🔴 Low

---

## ⏱️ Effort & Velocity

| Dev | Estimated | Actual | Accuracy | Tasks |
|----|----------|--------|----------|-------|
| [name] | Xh | Yh | Z% | N |
| **Team** | **Xh** | **Yh** | **Z%** | **N** |

**Velocity**: X story-points/sprint (or X hours/week)

---

## 🔍 Highlights

### ✅ Điểm tốt tuần này
- [Achievement 1]

### ⚠️ Rủi ro cần theo dõi
- [Risk 1] — Owner: [name]

### 🎯 Focus tuần tới
- [Priority 1]
```

## HTML Report

File HTML được generate kèm với markdown:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Dashboard: [Project] — [Period]</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           max-width: 960px; margin: 40px auto; padding: 0 20px; color: #333; }
    h1 { color: #1a1a2e; border-bottom: 3px solid #4361ee; padding-bottom: 8px; }
    h2 { color: #16213e; margin-top: 32px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #4361ee; color: white; padding: 10px 12px; text-align: left; }
    td { padding: 9px 12px; border-bottom: 1px solid #e9ecef; }
    tr:hover { background: #f8f9fa; }
    .badge-elite { background: #2ecc71; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .badge-high  { background: #3498db; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .badge-medium{ background: #f39c12; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .badge-low   { background: #e74c3c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
    .summary-card { background: #f8f9fa; border-left: 4px solid #4361ee;
                    padding: 16px; border-radius: 4px; }
    .summary-card .value { font-size: 28px; font-weight: 700; color: #4361ee; }
    .summary-card .label { font-size: 13px; color: #666; margin-top: 4px; }
    footer { margin-top: 48px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>Dashboard: [Project Name]</h1>
  <p>Period: <strong>[period]</strong> &nbsp;|&nbsp; Generated: [date]</p>

  <div class="summary-grid">
    <div class="summary-card"><div class="value">[X/Y]</div><div class="label">Tasks Done</div></div>
    <div class="summary-card"><div class="value">[X]h</div><div class="label">Velocity / week</div></div>
    <div class="summary-card"><div class="value">[X]%</div><div class="label">Est. Accuracy</div></div>
    <div class="summary-card"><div class="value">[X]</div><div class="label">Blocked Tasks</div></div>
  </div>

  <!-- Tasks table, DORA table, Effort table — populate từ data thu thập -->
  [CONTENT_PLACEHOLDER]

  <footer>Generated by dv-workflow-kit &nbsp;|&nbsp; <a href="../.dw/tasks/">Task Docs</a></footer>
</body>
</html>
```

Điền `[CONTENT_PLACEHOLDER]` với các bảng HTML tương ứng với nội dung markdown report.

## Lưu & Thông Báo

Sau khi tạo:
- Thông báo đường dẫn: `{paths.reports}/dashboard-[date].md` và `.html`
- Tóm tắt 3-5 bullets cho PM đọc nhanh
- Gợi ý: "Mở file .html trong browser để xem report đẹp hơn. Share .md qua Slack/email."
