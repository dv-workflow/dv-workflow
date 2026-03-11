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

## Tạo Report

Ghi ra `{paths.reports}/dashboard-[date].md`:

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

## Lưu & Thông Báo

Sau khi tạo:
- Thông báo đường dẫn file report
- Tóm tắt 3-5 bullets cho PM đọc nhanh
- Gợi ý: "Share file report hoặc paste vào Slack/email"
